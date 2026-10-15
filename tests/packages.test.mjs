import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import { transformSync } from "@babel/core";
import * as React from "react";
import { createFormControl } from "react-hook-form";

const require = createRequire(import.meta.url);
const event = () => ({ preventDefault() {}, persist() {} });
const plain = (value) => JSON.parse(JSON.stringify(value));

function load(path, mocks = {}, globals = {}) {
  const { code } = transformSync(
    readFileSync(new URL(path, import.meta.url), "utf8"),
    {
      babelrc: false,
      configFile: false,
      plugins: [
        [
          require.resolve("@babel/plugin-transform-react-jsx"),
          { runtime: "automatic" },
        ],
        require.resolve("@babel/plugin-transform-modules-commonjs"),
      ],
    },
  );
  const testModule = { exports: {} };
  vm.runInNewContext(code, {
    module: testModule,
    exports: testModule.exports,
    require: (name) => (name in mocks ? mocks[name] : require(name)),
    URL,
    FormData,
    ...globals,
  });
  return testModule.exports.default;
}

function find(tree, predicate) {
  if (!tree || typeof tree !== "object") return null;
  if (predicate(tree)) return tree;
  for (const child of React.Children.toArray(tree.props?.children)) {
    const found = find(child, predicate);
    if (found) return found;
  }
  return null;
}

function hooks() {
  let index = 0;
  const slots = [];
  let pending = [];
  const react = {
    ...React,
    useState(initial) {
      const slot = index++;
      if (!(slot in slots))
        slots[slot] = typeof initial === "function" ? initial() : initial;
      return [
        slots[slot],
        (next) => {
          slots[slot] = typeof next === "function" ? next(slots[slot]) : next;
        },
      ];
    },
    useRef(initial) {
      const slot = index++;
      slots[slot] ??= { current: initial };
      return slots[slot];
    },
    useCallback(callback) {
      index++;
      return callback;
    },
    useEffect(callback, dependencies) {
      const slot = index++;
      if (
        !slots[slot] ||
        dependencies.some((value, i) => value !== slots[slot][i])
      ) {
        slots[slot] = dependencies;
        pending.push(callback);
      }
    },
  };
  return {
    react,
    start() {
      index = 0;
    },
    effects() {
      const callbacks = pending;
      pending = [];
      callbacks.forEach((callback) => callback());
    },
  };
}

const UI = Object.fromEntries(
  ["Card", "FieldError", "StepActions", "ConfirmationDialog"].map((name) => [
    name,
    name,
  ]),
);
const icons = new Proxy({}, { get: (_, name) => String(name) });

test("untouched itinerary fields do not mark the step dirty when the editor is visited", () => {
  const h = stepHarness("ItinerariesStep", {
    record: {
      itineraries: [
        {
          id: 10,
          title: "Day 1",
          description: "<p>Arrival</p>",
          image_url: "https://example.test/day1.png",
        },
      ],
    },
  });
  assert.equal(h.form.control._getDirty(), false);
  h.form.setValue("itineraries.0.description", "<p>Arrival</p>", {
    shouldDirty: true,
  });
  assert.equal(h.form.control._getDirty(), false);
  h.form.setValue("itineraries.0.description", "<p>Changed</p>", {
    shouldDirty: true,
  });
  assert.equal(h.form.control._getDirty(), true);
  h.form.setValue("itineraries.0.description", "<p>Arrival</p>", {
    shouldDirty: true,
  });
  assert.equal(h.form.control._getDirty(), false);
  h.form.setValue(
    "itineraries.0.image_file",
    [new File(["image"], "new.png", { type: "image/png" })],
    { shouldDirty: true },
  );
  assert.equal(h.form.control._getDirty(), true);
  const fresh = stepHarness("ItinerariesStep");
  assert.equal(fresh.form.control._getDirty(), false);
});

test("rich-text initialization and unchanged input/formatting do not report edits, while editing and undo do", () => {
  const state = hooks();
  const changes = [];
  let blurs = 0;
  const editor = { innerHTML: "", focus() {} };
  const saved = "<p title='saved'>Arrival</p>";
  const details = stepHarness("DetailsStep", {
    record: { description: saved },
  });
  const component = load(
    "../src/components/admin/packages/RichTextEditor.jsx",
    { react: state.react },
    {
      DOMParser: class {
        parseFromString(value) {
          return {
            querySelectorAll: () => [],
            body: {
              innerHTML: value.replace(/'/g, '"'),
              querySelectorAll: () => [],
            },
          };
        }
      },
      document: {
        execCommand() {
          return false;
        },
      },
    },
  );
  state.start();
  const tree = component({
    id: "editor",
    label: "Description",
    value: saved,
    onChange: (value) => {
      changes.push(value);
      details.form.setValue("description", value, { shouldDirty: true });
    },
    onBlur: () => {
      blurs++;
    },
  });
  const textbox = find(tree, (element) => element.props?.role === "textbox");
  textbox.props.ref(editor);
  state.effects();
  const rendered = editor.innerHTML;
  assert.notEqual(rendered, saved);
  textbox.props.onInput({ currentTarget: editor });
  textbox.props.onBlur();
  find(
    tree,
    (element) => element.props?.["aria-label"] === "Bold",
  ).props.onClick();
  assert.equal(blurs, 1);
  assert.deepEqual(changes, []);
  assert.equal(details.form.control._getDirty(), false);
  editor.innerHTML = "<p>New description</p>";
  textbox.props.onInput({ currentTarget: editor });
  assert.equal(details.form.control._getDirty(), true);
  editor.innerHTML = rendered;
  textbox.props.onInput({ currentTarget: editor });
  assert.deepEqual(changes, ["<p>New description</p>", saved]);
  assert.equal(details.form.control._getDirty(), false);
});

function stepHarness(
  filename,
  { record = null, save = async () => {}, effects = false, api } = {},
) {
  const state = hooks();
  let form;
  let formState = { errors: {}, isSubmitting: false, isDirty: false };
  const calls = [];
  const busy = [];
  const notifications = [];
  const focused = [];
  const controller = "Controller";
  const rhf = {
    useForm(options) {
      if (!form) {
        // Defaults cross a VM boundary; clone them into RHF's realm so its
        // plain-object cloning keeps current values separate from defaults.
        form = createFormControl({
          ...options,
          defaultValues: plain(options.defaultValues),
        });
        form.subscribe({
          formState: {
            values: true,
            errors: true,
            isSubmitting: true,
            isDirty: true,
          },
          callback: (value) => {
            formState = value;
          },
        });
      }
      return {
        ...form,
        formState,
        setFocus: (name) => focused.push(name),
        register(name, rules) {
          if (rules?.pattern?.value)
            rules = {
              ...rules,
              pattern: {
                ...rules.pattern,
                value: new RegExp(
                  rules.pattern.value.source,
                  rules.pattern.value.flags,
                ),
              },
            };
          const registration = form.register(name, rules);
          registration.ref({
            name,
            type:
              name.endsWith("image_file") || name === "uploads"
                ? "file"
                : "text",
            value: form.getValues(name) ?? "",
          });
          return registration;
        },
      };
    },
    Controller: controller,
    useFieldArray({ control, name, rules }) {
      control._names.array.add(name);
      form.register(name, rules);
      return {
        fields: form
          .getValues(name)
          .map((item, i) => ({ ...item, fieldKey: `${i}` })),
        append(items) {
          form.setValue(
            name,
            [
              ...form.getValues(name),
              ...(Array.isArray(items) ? items : [items]),
            ],
            { shouldDirty: true },
          );
        },
        remove(index) {
          Object.keys(control._fields[name] ?? {})
            .filter((key) => key !== "_f")
            .forEach((key) => {
              delete control._fields[name][key];
            });
          form.setValue(
            name,
            form.getValues(name).filter((_, i) => i !== index),
            { shouldDirty: true },
          );
        },
        move(from, to) {
          const items = [...form.getValues(name)];
          items.splice(to, 0, ...items.splice(from, 1));
          Object.keys(control._fields[name] ?? {})
            .filter((key) => key !== "_f")
            .forEach((key) => {
              delete control._fields[name][key];
            });
          form.setValue(name, items, { shouldDirty: true });
        },
      };
    },
  };
  const toast = {
    __esModule: true,
    default: { success() {}, error: (message) => notifications.push(message) },
  };
  const useStep = load("../src/components/admin/packages/usePackageStep.jsx", {
    react: state.react,
    "react-hook-form": rhf,
    "react-hot-toast": toast,
  });
  const component = load(`../src/components/admin/packages/${filename}.jsx`, {
    react: state.react,
    "react-hook-form": rhf,
    "./usePackageStep": { __esModule: true, default: useStep },
    "./PackageUI": UI,
    "./RichTextEditor": { __esModule: true, default: "RichTextEditor" },
    "@/icons": icons,
    "@/components/admin/common/ImageUpload": {
      __esModule: true,
      default: "ImageUpload",
      ImagePreview: "ImagePreview",
    },
    "@/components/admin/categories/CategoryForm": {
      generateCategorySlug: (title) =>
        title
          .normalize("NFKD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
    },
    "@/lib/apis": { __esModule: true, default: { admin: api } },
  });
  let tree;
  const props = {
    record,
    active: true,
    busy: false,
    onDirty() {},
    onBusy: (value) => busy.push(value),
    onNavigate() {},
    onSave: async (...args) => {
      calls.push(args);
      return save(...args);
    },
  };
  function registerControllers(element) {
    if (!element || typeof element !== "object") return;
    if (element.type === controller) {
      form.register(element.props.name, element.props.rules);
      const nested = element.props.render({
        field: {
          value: form.getValues(element.props.name),
          ref() {},
          onChange: (value) =>
            form.setValue(element.props.name, value, { shouldDirty: true }),
          onBlur() {},
        },
        fieldState: {},
      });
      registerControllers(nested);
    }
    React.Children.toArray(element.props?.children).forEach(
      registerControllers,
    );
  }
  function render() {
    state.start();
    tree = component(props);
    registerControllers(tree);
    if (effects) state.effects();
    return tree;
  }
  render();
  return {
    form,
    calls,
    busy,
    focused,
    notifications,
    render,
    node: (predicate) => find(tree, predicate),
    submit: () => tree.props.onSubmit(event()),
    change: async (name, value) => {
      await find(tree, (node) => node.props?.name === name).props.onChange({
        type: "change",
        target: { name, value },
      });
      render();
    },
  };
}

test("package API uses all step endpoints, preserves errors, and overrides multipart PATCH only in the API", async () => {
  const calls = [];
  const response = { data: { status: true, data: { id: 9 } } };
  const client = Object.fromEntries(
    ["get", "post", "patch", "delete"].map((method) => [
      method,
      async (...args) => {
        calls.push([method, ...args]);
        return response;
      },
    ]),
  );
  const api = load("../src/lib/apis/admin/packages.js", {
    "@/lib/axios": { __esModule: true, default: client },
  });
  const payload = new FormData();
  payload.append(
    "itineraries[0][image]",
    new File(["image"], "day.png", { type: "image/png" }),
  );
  assert.equal(
    await api.getpackages({ page: 2, status: "0", per_page: 6 }),
    response.data,
  );
  await api.getPackage(9);
  await api.createPackage({ title: "Package" });
  await api.updatePackage(9, { title: "Updated" });
  await api.saveRelations(9, { category_ids: [1], destination_ids: [2] });
  await api.saveItineraries(9, payload);
  await api.saveDetails(9, { description: "Tour" });
  await api.savePhotos(9, payload);
  await api.deletePackage(9);
  assert.deepEqual(
    calls.map(([method, url]) => [method, url]),
    [
      ["get", "/admin/packages"],
      ["get", "/admin/packages/9"],
      ["post", "/admin/packages/basic-details"],
      ["patch", "/admin/packages/9/basic-details"],
      ["patch", "/admin/packages/9/categories-destinations"],
      ["post", "/admin/packages/9/itineraries"],
      ["patch", "/admin/packages/9/details"],
      ["post", "/admin/packages/9/photos"],
      ["delete", "/admin/packages/9"],
    ],
  );
  assert.equal(calls[5][2].get("_method"), "PATCH");
  assert.equal(calls[5][2].get("itineraries[0][image]").name, "day.png");
  assert.equal(payload.has("_method"), false);
  const failure = { message: "Invalid", errors: { title: ["Required"] } };
  client.patch = async () => {
    throw { response: { data: failure } };
  };
  await assert.rejects(api.updatePackage(9, {}), (error) => error === failure);
});

test("basic details enforce backend requirements, optional SEO and slug customization", async () => {
  const h = stepHarness("BasicDetailsStep");
  await h.submit();
  assert.equal(h.calls.length, 0);
  assert.ok(h.form.getFieldState("duration").error);
  await h.change("title", "Héritage Escape");
  assert.equal(h.form.getValues("slug"), "heritage-escape");
  await h.change("slug", "custom-escape");
  await h.change("title", "New title");
  assert.equal(h.form.getValues("slug"), "custom-escape");
  h.form.setValue("duration", "6 Nights 7 Days");
  await h.submit();
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0][0], 1);
  assert.equal(h.calls[0][1].status, true);
  assert.equal(h.calls[0][1].meta_title, "");
  h.form.setValue("slug", "Invalid Slug");
  await h.submit();
  assert.equal(h.calls.length, 1);
});

test("submission failures retain values, display field/unmapped errors, and block duplicate requests", async () => {
  let reject;
  const pending = new Promise((_, fail) => {
    reject = fail;
  });
  const h = stepHarness("BasicDetailsStep", {
    record: { id: 9, title: "Tour", slug: "tour", duration: "7 Days" },
    save: () => pending,
    effects: true,
  });
  const first = h.submit();
  await h.submit();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(h.calls.length, 1);
  reject({
    message: "Validation failed",
    errors: { slug: ["Already taken"], permission: ["Cannot edit"] },
  });
  await first;
  h.render();
  assert.equal(h.form.getValues("title"), "Tour");
  assert.equal(h.form.getFieldState("slug").error.message, "Already taken");
  assert.match(
    h.form.getFieldState("root.server").error.message,
    /Cannot edit/,
  );
  assert.ok(h.focused.includes("slug"));
  assert.equal(h.busy.at(-1), false);
});

test("relations fetch every option page and preserve hidden selections during search", async () => {
  const pages = [];
  const api = {
    categories: {
      getCategories: async ({ page }) => {
        pages.push(["category", page]);
        return {
          data: [{ id: page, title: `Category ${page}` }],
          pagination: { last_page: 3 },
        };
      },
    },
    destinations: {
      getDestinations: async ({ page }) => {
        pages.push(["destination", page]);
        return {
          data: [{ id: page, title: `City ${page}`, destination_type: 1 }],
          pagination: { last_page: 2 },
        };
      },
    },
  };
  const h = stepHarness("RelationsStep", {
    record: { category_ids: [1, 3], destination_ids: [2] },
    api,
    effects: true,
  });
  await new Promise((resolve) => setImmediate(resolve));
  h.render();
  assert.deepEqual(
    pages.filter(([kind]) => kind === "category").map(([, page]) => page),
    [1, 2, 3],
  );
  assert.deepEqual(
    pages.filter(([kind]) => kind === "destination").map(([, page]) => page),
    [1, 2],
  );
  h.node((node) => node.props?.id === "package-category-search").props.onChange(
    { target: { value: "Category 2" } },
  );
  h.render();
  await h.submit();
  assert.deepEqual(plain(h.calls[0][1]), {
    category_ids: [1, 3],
    destination_ids: [2],
  });
  h.form.setValue("category_ids", []);
  await h.submit();
  assert.equal(h.calls.length, 1);
});

test("itineraries retain IDs/images, serialize ordered uploads and explicit deletions", async () => {
  const h = stepHarness("ItinerariesStep", {
    record: {
      itineraries: [
        {
          id: 10,
          title: "Day 1",
          description: "Arrival",
          image_url: "https://example.test/day1.png",
        },
        { id: 11, title: "Day 2", description: "Tour" },
      ],
    },
  });
  h.node(
    (node) => node.props?.["aria-label"] === "Move itinerary 2 up",
  ).props.onClick();
  h.render();
  h.node(
    (node) =>
      node.type === "button" &&
      React.Children.toArray(node.props.children).includes("Remove"),
  ).props.onClick();
  h.render();
  const file = new File(["image"], "new.png", { type: "image/png" });
  h.form.setValue("itineraries.0.image_file", [file]);
  await h.submit();
  assert.equal(
    h.calls.length,
    1,
    JSON.stringify(h.form.control._formState.errors),
  );
  const data = h.calls[0][1];
  assert.equal(data.get("itineraries[0][id]"), "10");
  assert.equal(data.get("deleted_itinerary_ids[0]"), "11");
  assert.equal(data.get("itineraries[0][sort_order]"), "1");
  assert.equal(data.get("itineraries[0][image]").name, "new.png");
  assert.equal(data.has("itineraries[0][image_url]"), false);
  h.form.setValue("itineraries.0.image_file", [
    new File(["bad"], "bad.svg", { type: "image/svg+xml" }),
  ]);
  await h.submit();
  assert.equal(h.calls.length, 1);
  const empty = stepHarness("ItinerariesStep");
  assert.equal(empty.form.getValues("itineraries").length, 1);
  await empty.submit();
  assert.equal(empty.calls.length, 0);
});

test("package details require a description and send the five exact fields", async () => {
  const h = stepHarness("DetailsStep");
  await h.submit();
  assert.equal(h.calls.length, 0);
  h.form.setValue("description", "<p><br></p>");
  await h.submit();
  assert.equal(h.calls.length, 0);
  h.form.setValue("description", "<p>Heritage tour</p>");
  await h.submit();
  assert.equal(h.calls[0][0], 4);
  assert.deepEqual(Object.keys(h.calls[0][1]).sort(), [
    "accommodation_details",
    "description",
    "exclusion",
    "inclusion",
    "transportation",
  ]);
});

test("photos reorder existing IDs without reuploading, retain new files and submit explicit deletions", async () => {
  const h = stepHarness("PhotosStep", {
    record: {
      images: [
        { id: 20, image: "one.png" },
        { id: 21, image: "two.png" },
      ],
    },
  });
  h.node(
    (node) => node.props?.["aria-label"] === "Move photo 2 earlier",
  ).props.onClick();
  h.render();
  await h.submit();
  assert.deepEqual(plain(h.calls[0][1]), {
    photos: [
      { id: 21, sort_order: 1 },
      { id: 20, sort_order: 2 },
    ],
    deleted_image_ids: [],
  });
  h.node(
    (node) => node.props?.["aria-label"] === "Remove photo 2",
  ).props.onClick();
  h.render();
  const image = new File(["photo"], "new.webp", { type: "image/webp" });
  h.node((node) => node.props?.id === "package-uploads").props.onChange({
    target: { files: [image], value: "" },
  });
  h.render();
  await h.submit();
  const data = h.calls[1][1];
  assert.equal(data.get("photos[0][id]"), "21");
  assert.equal(data.has("photos[0][image]"), false);
  assert.equal(data.get("photos[1][image]").name, "new.webp");
  assert.equal(data.get("photos[1][sort_order]"), "2");
  assert.equal(data.get("deleted_image_ids[0]"), "20");
  const empty = stepHarness("PhotosStep");
  await empty.submit();
  assert.equal(empty.calls.length, 0);
  assert.ok(empty.form.getFieldState("photos").error);
});

function manager(record, responder) {
  const state = hooks();
  const requests = [];
  const navigation = [];
  const methods = [
    "createPackage",
    "updatePackage",
    "saveRelations",
    "saveItineraries",
    "saveDetails",
    "savePhotos",
  ];
  const api = Object.fromEntries(
    methods.map((method) => [
      method,
      async (...args) => {
        requests.push([method, ...args]);
        return responder(method, ...args);
      },
    ]),
  );
  const mocks = {
    react: state.react,
    "react-hot-toast": { __esModule: true, default: { success() {} } },
    "@/lib/apis": { __esModule: true, default: { admin: { packages: api } } },
    "@/i18n/navigation": {
      useRouter: () => ({
        push: (url) => navigation.push(["push", url]),
        replace: (url) => navigation.push(["replace", url]),
      }),
    },
    "@/components/admin/common/PageBreadCrumb": {
      __esModule: true,
      default: "Breadcrumb",
    },
    "./PackageUI": UI,
  };
  [
    "PackageStepper",
    "BasicDetailsStep",
    "RelationsStep",
    "ItinerariesStep",
    "DetailsStep",
    "PhotosStep",
  ].forEach((name) => {
    mocks[`./${name}`] = { __esModule: true, default: name };
  });
  const component = load(
    "../src/components/admin/packages/PackageForm.jsx",
    mocks,
    { window: { addEventListener() {}, removeEventListener() {} } },
  );
  let tree;
  function render() {
    state.start();
    tree = component({ packageRecord: record });
    return tree;
  }
  render();
  return {
    render,
    requests,
    navigation,
    node: (type) => find(tree, (element) => element.type === type),
    save: (number, data) =>
      find(tree, (element) => element.type === "BasicDetailsStep").props.onSave(
        number,
        data,
      ),
  };
}

test("creation replaces URL with saved ID and never creates twice when step one is revisited", async () => {
  const h = manager(null, async () => ({
    status: true,
    data: { id: 9, current_step: 2, completed_steps: [1], is_complete: false },
  }));
  await h.save(1, { title: "Tour" });
  h.render();
  assert.deepEqual(h.navigation, [["replace", "/admin/packages/9/edit"]]);
  await h.save(1, { title: "Updated" });
  assert.deepEqual(
    h.requests.map(([method]) => method),
    ["createPackage", "updatePackage"],
  );
  assert.equal(h.requests[1][1], 9);
});

test("resume opens pending step, completed steps are reachable, future steps blocked and failures do not advance", async () => {
  const record = {
    id: 9,
    current_step: 3,
    completed_steps: [1, 2],
    is_complete: false,
  };
  const h = manager(record, async () => {
    throw { message: "Save failed" };
  });
  assert.equal(h.node("PackageStepper").props.step, 3);
  h.node("PackageStepper").props.onNavigate(5);
  h.render();
  assert.equal(h.node("PackageStepper").props.step, 3);
  h.node("PackageStepper").props.onNavigate(1);
  h.render();
  assert.equal(h.node("PackageStepper").props.step, 1);
  await assert.rejects(h.save(1, {}));
  h.render();
  assert.equal(h.node("PackageStepper").props.step, 1);
});

test("completed packages allow all steps, earlier saves preserve progress, and dirty step switching confirms", async () => {
  const record = {
    id: 9,
    current_step: 6,
    completed_steps: [1, 2, 3, 4, 5],
    is_complete: true,
  };
  const h = manager(record, async () => ({ status: true, data: record }));
  h.node("PackageStepper").props.onNavigate(5);
  h.render();
  assert.equal(h.node("PackageStepper").props.step, 5);
  h.node("PhotosStep").props.onDirty(5, true);
  h.node("PackageStepper").props.onNavigate(1);
  h.render();
  assert.equal(h.node("PackageStepper").props.step, 5);
  assert.ok(h.node("ConfirmationDialog"));
  h.node("ConfirmationDialog").props.onConfirm();
  h.render();
  assert.equal(h.node("PackageStepper").props.step, 1);
  await h.save(1, {});
  h.render();
  assert.equal(h.node("PackageStepper").props.record.current_step, 6);
  assert.equal(h.node("PhotosStep").props.finalLabel, "Save Changes");
});

test("saving steps two through five calls the matching API and returns to the listing", async () => {
  const h = manager(
    { id: 9, current_step: 2, completed_steps: [1] },
    async (method) => ({
      status: true,
      data: {
        id: 9,
        current_step: {
          saveRelations: 3,
          saveItineraries: 4,
          saveDetails: 5,
          savePhotos: 6,
        }[method],
      },
    }),
  );
  for (let step = 2; step <= 5; step++) {
    await h.save(step, { step });
    h.render();
  }
  assert.deepEqual(
    h.requests.map(([method]) => method),
    ["saveRelations", "saveItineraries", "saveDetails", "savePhotos"],
  );
  assert.deepEqual(h.navigation, [["push", "/admin/packages"]]);
});

test("backend itinerary image errors are attached to the editable uploader", async () => {
  const h = stepHarness("ItinerariesStep", {
    record: {
      itineraries: [{ id: 10, title: "Day 1", description: "Arrival" }],
    },
    save: async () => {
      throw {
        message: "Invalid image",
        errors: { "itineraries.0.image": ["Image is too large"] },
      };
    },
  });
  await h.submit();
  assert.equal(
    h.form.getFieldState("itineraries.0.image_file").error.message,
    "Image is too large",
  );
  assert.equal(h.form.getValues("itineraries.0.title"), "Day 1");
});

test("listing sends filters and page size, resets page on filters, and moves back after deleting the last row", async () => {
  const state = hooks();
  const calls = [];
  let single = false;
  const api = {
    getpackages: async (params) => {
      calls.push(["list", plain(params)]);
      return {
        data: single
          ? [{ id: 7, title: "Tour" }]
          : Array.from({ length: 6 }, (_, i) => ({ id: i + 1 })),
        pagination: {
          current_page: params.page,
          last_page: 3,
          total: 13,
          from: 1,
          to: 6,
        },
      };
    },
    deletePackage: async (id) => {
      calls.push(["delete", id]);
      return { message: "Deleted" };
    },
  };
  const component = load("../src/components/admin/packages/PackageList.jsx", {
    react: state.react,
    "react-hot-toast": {
      __esModule: true,
      default: { success() {}, error() {} },
    },
    "@/lib/apis": { __esModule: true, default: { admin: { packages: api } } },
    "@/components/admin/common/PageBreadCrumb": {
      __esModule: true,
      default: "Breadcrumb",
    },
    "@/components/admin/tables/Pagination": {
      __esModule: true,
      default: "Pagination",
    },
    "./PackageFilters": { __esModule: true, default: "PackageFilters" },
    "./PackageTable": { __esModule: true, default: "PackageTable" },
    "./PackageUI": UI,
  });
  let tree;
  function render() {
    state.start();
    tree = component();
    state.effects();
  }
  const node = (type) => find(tree, (element) => element.type === type);
  async function settle() {
    await new Promise((resolve) => setImmediate(resolve));
    render();
  }
  render();
  await settle();
  assert.deepEqual(calls.at(-1), ["list", { page: 1, per_page: 6 }]);
  node("Pagination").props.onPageChange(2);
  render();
  await settle();
  assert.equal(calls.at(-1)[1].page, 2);
  node("PackageFilters").props.onSearch({ keyword: "heritage", status: "0" });
  render();
  await settle();
  assert.deepEqual(calls.at(-1)[1], {
    page: 1,
    per_page: 6,
    keyword: "heritage",
    status: "0",
  });
  find(
    tree,
    (element) => element.props?.id === "package-page-size",
  ).props.onChange({ target: { value: "15" } });
  render();
  await settle();
  assert.equal(calls.at(-1)[1].per_page, 15);
  single = true;
  node("Pagination").props.onPageChange(3);
  render();
  await settle();
  node("PackageTable").props.onDelete({ id: 7, title: "Tour" });
  render();
  await node("ConfirmationDialog").props.onConfirm();
  render();
  await settle();
  assert.ok(calls.some(([method, id]) => method === "delete" && id === 7));
  assert.equal(calls.at(-1)[1].page, 2);
});

test("stepper disables unfinished steps and enables every step of a complete package", () => {
  const component = load(
    "../src/components/admin/packages/PackageStepper.jsx",
    { "@/icons": icons },
  );
  const pending = component({
    step: 3,
    record: { current_step: 3, completed_steps: [1, 2] },
    onNavigate() {},
  });
  assert.equal(
    find(
      pending,
      (element) =>
        element.type === "button" &&
        element.props["aria-label"].startsWith("Photos"),
    ).props.disabled,
    true,
  );
  assert.equal(
    Boolean(
      find(
        pending,
        (element) =>
          element.type === "button" &&
          element.props["aria-label"].startsWith("Basic Details"),
      ).props.disabled,
    ),
    false,
  );
  const complete = component({
    step: 1,
    record: {
      current_step: 6,
      is_complete: true,
      completed_steps: [1, 2, 3, 4, 5],
    },
    onNavigate() {},
  });
  assert.equal(
    Boolean(
      find(
        complete,
        (element) =>
          element.type === "button" &&
          element.props["aria-label"].startsWith("Photos"),
      ).props.disabled,
    ),
    false,
  );
});
