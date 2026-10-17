import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import { transformSync } from "@babel/core";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createFormControl } from "react-hook-form";

const require = createRequire(import.meta.url);

function loadSource(path, mocks = {}, globals = {}) {
  const { code } = transformSync(readFileSync(new URL(path, import.meta.url), "utf8"), {
    babelrc: false, configFile: false,
    plugins: [[require.resolve("@babel/plugin-transform-react-jsx"), { runtime: "automatic" }], require.resolve("@babel/plugin-transform-modules-commonjs")],
  });
  const testModule = { exports: {} };
  vm.runInNewContext(code, {
    module: testModule, exports: testModule.exports,
    require: (name) => name in mocks ? mocks[name] : require(name),
    URL, URLSearchParams, FormData, ...globals,
  });
  return testModule.exports;
}

test("destination CRUD uses the shared Axios client and preserves responses and payloads", async () => {
  const calls = [];
  const response = { data: { data: [], pagination: { total: 0 }, message: "Saved" } };
  const client = Object.fromEntries(["get", "post", "put", "delete"].map((method) => [method, async (...args) => {
    calls.push([method, ...args]);
    return response;
  }]));
  const api = loadSource("../src/lib/apis/admin/destinations.js", { "@/lib/axios": { __esModule: true, default: client } }).default;
  const params = new URLSearchParams({ page: "2", per_page: "6", search: "heritage", status: "0" });
  const data = new FormData(); data.append("title", "Heritage");
  assert.equal(await api.getDestinations(params), response.data);
  assert.equal(await api.getDestination(9), response.data);
  assert.equal(await api.createDestination(data), response.data);
  assert.equal(await api.updateDestination(9, data), response.data);
  assert.equal(await api.deleteDestination(9), response.data);
  assert.deepEqual(calls.map(([method, url]) => [method, url]), [
    ["get", "/admin/destinations"], ["get", "/admin/destinations/9"], ["post", "/admin/destinations"], ["post", "/admin/destinations/9"], ["delete", "/admin/destinations/9"],
  ]);
  assert.equal(calls[0][2].params, params);
  assert.equal(calls[2][2], data);
  assert.equal(calls[3][2].get("title"), "Heritage");
  assert.equal(calls[3][2].get("_method"), "PUT");
  assert.equal(data.has("_method"), false);
});

test("multipart updates preserve the replacement image and status while JSON updates use PUT", async () => {
  const calls = [];
  const client = Object.fromEntries(["post", "put"].map((method) => [method, async (url, data, config) => {
    calls.push({ method, url, data, config });
    return { data: { message: "Updated" } };
  }]));
  const api = loadSource("../src/lib/apis/admin/destinations.js", { "@/lib/axios": { __esModule: true, default: client } }).default;
  const data = new FormData();
  data.append("title", "Updated destination");
  data.append("status", "0");
  data.append("image", new File(["replacement-image"], "replacement.png", { type: "image/png" }));
  data.set("_method", "PATCH");
  await api.updateDestination(9, data);
  assert.equal(calls[0].method, "post");
  assert.equal(calls[0].url, "/admin/destinations/9");
  assert.equal(calls[0].config.headers["Content-Type"], "multipart/form-data");
  assert.deepEqual(calls[0].data.getAll("_method"), ["PUT"]);
  assert.equal(calls[0].data.get("status"), "0");
  assert.equal(calls[0].data.get("image").name, "replacement.png");
  assert.equal(calls[0].data.get("image").type, "image/png");
  assert.equal(await calls[0].data.get("image").text(), "replacement-image");
  assert.equal(data.get("_method"), "PATCH");
  const json = { title: "Text-only update", status: false };
  await api.updateDestination(9, json);
  assert.equal(calls[1].method, "put");
  assert.equal(calls[1].data, json);
});

test("destination API preserves backend validation and permission errors with fallback messages", async () => {
  const validation = { message: "Validation failed", errors: { slug: ["Already taken"] } };
  const client = {
    post: async () => { throw { response: { data: validation } }; },
    delete: async () => { throw { response: { data: { message: "Forbidden" } } }; },
    get: async () => { throw new Error("Network error"); },
  };
  const api = loadSource("../src/lib/apis/admin/destinations.js", { "@/lib/axios": { __esModule: true, default: client } }).default;
  await assert.rejects(api.createDestination(new FormData()), (error) => error === validation);
  await assert.rejects(api.deleteDestination(9), (error) => error.message === "Forbidden");
  await assert.rejects(api.getDestination(9), (error) => error.message === "Failed to fetch destination");
});

function walk(element, predicate) {
  if (!element || typeof element !== "object") return null;
  if (predicate(element)) return element;
  for (const child of React.Children.toArray(element.props?.children)) {
    const found = walk(child, predicate);
    if (found) return found;
  }
  return null;
}

function formHarness({ destination = null, save } = {}) {
  let index = 0;
  const slots = [];
  let form;
  let formState = { errors: {}, isSubmitting: false };
  let tree;
  const requests = [];
  const navigation = [];
  const notifications = [];
  const api = {
    createDestination: async (data) => { requests.push(["create", data]); return save ? save(data) : { message: "Created" }; },
    updateDestination: async (id, data) => { requests.push(["update", id, data]); return save ? save(data) : { message: "Updated" }; },
  };
  const reactMock = {
    ...React,
    useRef: (initial) => { const slot = index++; slots[slot] ??= { current: initial }; return slots[slot]; },
    useState: (initial) => { const slot = index++; if (!(slot in slots)) slots[slot] = initial; return [slots[slot], (next) => { slots[slot] = typeof next === "function" ? next(slots[slot]) : next; }]; },
    useEffect: () => {},
  };
  const exports = loadSource("../src/components/admin/destinations/DestinationForm.jsx", {
    react: reactMock,
    "react-hook-form": { useForm: (options) => {
      if (!form) {
        form = createFormControl(options);
        form.subscribe({ formState: { values: true, errors: true, isSubmitting: true }, callback: (state) => { formState = state; } });
      }
      return { ...form, formState, register: (name, rules) => {
        // Rules come from a VM; React Hook Form checks RegExp in this realm.
        if (rules?.pattern?.value) {
          rules = { ...rules, pattern: { ...rules.pattern, value: new RegExp(rules.pattern.value.source, rules.pattern.value.flags) } };
        }
        const registration = form.register(name, rules);
        registration.ref({ name, type: name === "image" ? "file" : "text", value: form.getValues(name) ?? "" });
        return registration;
      } };
    } },
    "@/lib/apis": { __esModule: true, default: { admin: { destinations: api } } },
    "@/i18n/navigation": { useRouter: () => ({ push: (url) => navigation.push(url) }) },
    "react-hot-toast": { __esModule: true, default: { success: (message) => notifications.push(message), error: (message) => notifications.push(message) } },
    "@/icons": { ChevronLeftIcon: () => React.createElement("svg") },
    "@/components/admin/common/PageBreadCrumb": { __esModule: true, default: ({ pageTitle }) => React.createElement("h1", null, pageTitle) },
    "@/components/admin/common/ImageUpload": { __esModule: true, default: ({ existingImageUrl, label }) => React.createElement("img", { src: existingImageUrl, alt: label }), ImagePreview: ({ src, alt }) => React.createElement("img", { src, alt }) },
  });
  function render() { index = 0; tree = exports.default({ destination }); return tree; }
  render();
  return {
    form, requests, navigation, notifications, render,
    slug: exports.generateDestinationSlug,
    field: (name) => walk(tree, (element) => element.props?.name === name),
    click: async (label) => { await walk(tree, (element) => element.type === "button" && element.props.children === label).props.onClick(); render(); },
    change: async (name, value) => { await walk(tree, (element) => element.props?.name === name).props.onChange({ type: "change", target: { name, value } }); render(); },
    submit: () => walk(tree, (element) => element.type === "form").props.onSubmit({ preventDefault() {}, persist() {} }),
    html: () => renderToStaticMarkup(tree),
  };
}

test("create slug follows the title until customized and edit preserves its slug", async () => {
  const create = formHarness();
  await create.change("title", "Héritage Tours!");
  assert.equal(create.form.getValues("slug"), "heritage-tours");
  await create.change("slug", "royal-tours");
  await create.change("title", "New title");
  assert.equal(create.form.getValues("slug"), "royal-tours");
  const edit = formHarness({ destination: { id: 9, title: "Original", slug: "custom-original", status: false, image_url: "https://example.test/existing.png" } });
  await edit.change("title", "Changed title");
  assert.equal(edit.form.getValues("slug"), "custom-original");
  assert.equal(edit.form.getValues("status"), "0");
  assert.match(edit.html(), /existing\.png/);
});

test("explicit form fields enforce required values, backend text limits and slug rules", async () => {
  const form = formHarness();
  await form.submit();
  assert.equal(form.requests.length, 0);
  assert.ok(form.form.getFieldState("title").error);
  assert.ok(form.form.getFieldState("slug").error);
  form.form.setValue("title", "t".repeat(256)); form.form.setValue("slug", "Invalid Slug");
  form.form.setValue("meta_title", "m".repeat(256));
  await form.submit();
  assert.ok(form.form.getFieldState("title").error);
  assert.ok(form.form.getFieldState("slug").error);
  assert.ok(form.form.getFieldState("meta_title").error);
  assert.equal(form.requests.length, 0);
});

test("image validation enforces backend formats, extensions and the 2 MB limit", async () => {
  const form = formHarness();
  form.form.setValue("title", "Valid"); form.form.setValue("slug", "valid");
  form.form.setValue("image", [new File(["data"], "x.svg", { type: "image/svg+xml" })]);
  await form.submit(); assert.equal(form.requests.length, 0); assert.ok(form.form.getFieldState("image").error);
  form.form.setValue("image", [new File(["a".repeat(2 * 1024 * 1024 + 1)], "x.png", { type: "image/png" })]);
  await form.submit(); assert.equal(form.requests.length, 0); assert.match(form.form.getFieldState("image").error.message, /no larger/);
});

test("create sends only schema fields as multipart and returns to listing with success toast", async () => {
  const form = formHarness();
  await form.change("title", "Heritage");
  form.form.setValue("meta_keyword", " forts, luxury ");
  await form.submit();
  const data = form.requests[0][1];
  assert.ok(data instanceof FormData);
  assert.equal(data.get("title"), "Heritage");
  assert.equal(data.get("slug"), "heritage");
  assert.equal(data.get("destination_type"), "1");
  assert.equal(data.get("is_most_popular"), "0");
  assert.equal(data.get("meta_keyword"), " forts, luxury ");
  assert.deepEqual([...data.keys()].sort(), ["description", "destination_type", "is_most_popular", "meta_description", "meta_keyword", "meta_title", "slug", "status", "title"]);
  assert.deepEqual(form.navigation, ["/admin/destinations"]);
  assert.deepEqual(form.notifications, ["Created"]);
});

test("edit omits unchanged image and sends a replacement file only when selected", async () => {
  const destination = { id: 9, title: "Heritage", slug: "heritage", status: true, image_url: "https://example.test/stored.png" };
  const form = formHarness({ destination });
  await form.submit(); assert.equal(form.requests[0][2].has("image"), false);
  form.form.setValue("image", [new File(["binary"], "replacement.png", { type: "image/png" })]);
  await form.submit(); assert.equal(form.requests[1][2].get("image").name, "replacement.png");
  assert.equal(form.requests[1][2].has("id"), false);
});

test("stored images are retained and are not offered an unsupported removal action", () => {
  const form = formHarness({ destination: { id: 9, title: "Heritage", slug: "heritage", status: true, image_url: "https://example.test/stored.png" } });
  assert.doesNotMatch(form.html(), />Remove image</);
  assert.match(form.html(), /stored\.png/);
});

test("backend errors remain visible per field, preserve values and allow a corrected retry", async () => {
  let attempts = 0;
  const form = formHarness({ save: async () => {
    if (++attempts === 1) throw { message: "Validation failed", errors: { slug: ["Slug already exists"], general: ["Try another slug"] } };
    return { message: "Saved" };
  } });
  await form.change("title", "Heritage"); await form.submit();
  assert.equal(form.form.getFieldState("slug").error.message, "Slug already exists");
  assert.match(form.form.getFieldState("root.server").error.message, /Try another slug/);
  assert.equal(form.form.getValues("title"), "Heritage");
  assert.equal(form.navigation.length, 0);
  await form.change("slug", "heritage-new"); await form.submit();
  assert.equal(attempts, 2); assert.deepEqual(form.navigation, ["/admin/destinations"]);
});

test("pending save disables submit and blocks duplicate submissions and cancel navigation", async () => {
  let finish;
  let started;
  const ready = new Promise((resolve) => { started = resolve; });
  const pending = new Promise((resolve) => { finish = resolve; });
  const form = formHarness({ save: async () => { started(); await pending; return { message: "Saved" }; } });
  await form.change("title", "Heritage");
  const saving = form.submit(); await ready;
  form.render(); assert.match(form.html(), /disabled=""[^>]*>Saving\.\.\./);
  await form.submit(); await form.click("Cancel");
  assert.equal(form.requests.length, 1); assert.equal(form.navigation.length, 0);
  finish(); await saving; assert.equal(form.navigation.length, 1);
});

test("destination table renders boolean statuses and public image URLs without a status helper", () => {
  const wrapper = ({ children }) => React.createElement("div", null, children);
  const table = loadSource("../src/components/admin/destinations/DestinationTable.jsx", {
    "@headlessui/react": { Menu: wrapper, MenuButton: wrapper, MenuItem: wrapper, MenuItems: wrapper },
    "@/i18n/navigation": { Link: ({ href, children }) => React.createElement("a", { href }, children) },
    "@/icons": { EyeIcon: wrapper, MoreDotIcon: wrapper, PencilIcon: wrapper, PlusIcon: wrapper, TrashBinIcon: wrapper },
    "@/components/admin/ui/table": { Table: wrapper, TableBody: wrapper, TableCell: wrapper, TableHeader: wrapper, TableRow: wrapper },
    "@/components/admin/common/ImageUpload": { __esModule: true, default: ({ existingImageUrl, label }) => React.createElement("img", { src: existingImageUrl, alt: label }), ImagePreview: ({ src, alt }) => React.createElement("img", { src, alt }) },
  }).default;
  const html = renderToStaticMarkup(React.createElement(table, {
    destinations: [
      { id: 1, title: "Heritage", slug: "heritage", status: true, destination_type: 1, is_most_popular: true, image: "destinations/stored.png", image_url: "https://example.test/public.png" },
      { id: 2, title: "Hidden", slug: "hidden", status: false, destination_type: 2, is_most_popular: false },
    ], total: 2,
  }));
  assert.match(html, />Active</);
  assert.match(html, />Inactive</);
  assert.match(html, />Domestic</);
  assert.match(html, />International</);
  assert.match(html, />Yes</);
  assert.match(html, />No</);
  assert.match(html, />View details</);
  assert.match(html, /href="\/admin\/destinations\/1"/);
  assert.doesNotMatch(html, /checkbox|Export|Star/);
  assert.match(html, /https:\/\/example\.test\/public\.png/);
  assert.doesNotMatch(html, /destinations\/stored\.png/);
});

test("destination settings validate supported types and serialize booleans for Laravel multipart", async () => {
  const form = formHarness({ destination: { id: 9, title: "Dubai", slug: "dubai", destination_type: 2, is_most_popular: true, status: false } });
  assert.equal(form.form.getValues("destination_type"), "2");
  assert.equal(form.form.getValues("is_most_popular"), true);
  await form.submit();
  const data = form.requests[0][2];
  assert.equal(data.get("destination_type"), "2");
  assert.equal(data.get("is_most_popular"), "1");
  assert.equal(data.get("status"), "0");
  form.form.setValue("destination_type", "3");
  await form.submit();
  assert.equal(form.requests.length, 1);
  assert.ok(form.form.getFieldState("destination_type").error);
  form.form.setValue("destination_type", "1");
  form.form.setValue("title", "   ");
  await form.submit();
  assert.equal(form.requests.length, 1);
  assert.ok(form.form.getFieldState("title").error);
});

function listHarness({ getDestinations, deleteDestination = async () => ({ message: "Deleted" }) }) {
  let index = 0;
  const slots = [];
  const effects = [];
  let tree;
  const calls = [];
  const notifications = [];
  const reactMock = {
    ...React,
    useRef: (initial) => { const slot = index++; slots[slot] ??= { current: initial }; return slots[slot]; },
    useState: (initial) => { const slot = index++; if (!(slot in slots)) slots[slot] = initial; return [slots[slot], (next) => { slots[slot] = typeof next === "function" ? next(slots[slot]) : next; }]; },
    useEffect: (callback, dependencies) => {
      const slot = index++;
      const previous = slots[slot];
      if (!previous || dependencies.some((value, i) => value !== previous.dependencies[i])) {
        previous?.cleanup?.();
        slots[slot] = { callback, dependencies };
        effects.push(slots[slot]);
      }
    },
  };
  const Filter = () => null;
  const Table = () => null;
  const Pagination = () => null;
  const Delete = () => null;
  const List = loadSource("../src/components/admin/destinations/DestinationList.jsx", {
    react: reactMock,
    "@/lib/apis": { __esModule: true, default: { admin: { destinations: {
      getDestinations: async (params) => { calls.push(Object.fromEntries(params)); return getDestinations(params); },
      deleteDestination,
    } } } },
    "react-hot-toast": { __esModule: true, default: { success: (message) => notifications.push(message), error: (message) => notifications.push(message) } },
    "@/components/admin/common/PageBreadCrumb": { __esModule: true, default: () => null },
    "@/components/admin/tables/Pagination": { __esModule: true, default: Pagination },
    "./DestinationFilters": { __esModule: true, default: Filter },
    "./DestinationTable": { __esModule: true, default: Table },
    "./DeleteDestinationDialog": { __esModule: true, default: Delete },
  }).default;
  function render() {
    index = 0;
    tree = List();
    for (const effect of effects.splice(0)) effect.cleanup = effect.callback();
  }
  render();
  return {
    calls, notifications, render,
    settle: async () => { await new Promise(setImmediate); render(); },
    filters: () => walk(tree, (element) => element.type === Filter).props,
    table: () => walk(tree, (element) => element.type === Table).props,
    pagination: () => walk(tree, (element) => element.type === Pagination)?.props,
    pageSize: () => walk(tree, (element) => element.type === "select").props,
    dialog: () => walk(tree, (element) => element.type === Delete)?.props,
    retry: () => walk(tree, (element) => element.type === "button" && element.props.children === "Try again").props.onClick(),
    unmount: () => { for (const slot of slots) slot?.cleanup?.(); },
  };
}

function listResponse(page = 1, data = [{ id: 9, title: "Jaipur" }]) {
  return { data, pagination: { current_page: page, last_page: 3, per_page: 6, total: 13, from: 1, to: 6 } };
}

test("listing sends backend filter names and inactive status, and resets page on filters/page size", async () => {
  const list = listHarness({ getDestinations: async (params) => listResponse(Number(params.get("page"))) });
  await list.settle();
  assert.deepEqual(list.calls[0], { page: "1", per_page: "6" });
  list.pagination().onPageChange(2); list.render(); await list.settle();
  assert.equal(list.calls[1].page, "2");
  list.filters().onSearch({ search: " Dubai ", destination_type: "2", status: "0" }); list.render(); await list.settle();
  assert.deepEqual(list.calls[2], { page: "1", per_page: "6", search: " Dubai ", destination_type: "2", status: "0" });
  list.pagination().onPageChange(2); list.render(); await list.settle();
  list.pageSize().onChange({ target: { value: "30" } }); list.render(); await list.settle();
  assert.equal(list.calls.at(-1).page, "1");
  assert.equal(list.calls.at(-1).per_page, "30");
  list.filters().onSearch({ search: "", destination_type: "", status: "" }); list.render(); await list.settle();
  assert.deepEqual(list.calls.at(-1), { page: "1", per_page: "30" });
});

test("listing ignores stale responses and retains loading until the active request finishes", async () => {
  const pending = [];
  const list = listHarness({ getDestinations: () => new Promise((resolve) => pending.push(resolve)) });
  list.filters().onSearch({ search: "Dubai", destination_type: "", status: "" }); list.render();
  pending[0](listResponse(1, [{ id: 1, title: "Stale Jaipur" }])); await list.settle();
  assert.equal(list.table().isLoading, true);
  assert.equal(list.table().destinations.length, 0);
  pending[1](listResponse(1, [{ id: 2, title: "Dubai" }])); await list.settle();
  assert.equal(list.table().isLoading, false);
  assert.equal(list.table().destinations[0].title, "Dubai");
  list.unmount();
});

test("deleting the sole record on the final page moves back, refetches, and blocks duplicate deletes", async () => {
  let finish;
  let attempts = 0;
  const list = listHarness({
    getDestinations: async (params) => listResponse(Number(params.get("page"))),
    deleteDestination: async () => { attempts++; await new Promise((resolve) => { finish = resolve; }); return { message: "Removed" }; },
  });
  await list.settle();
  list.pagination().onPageChange(3); list.render(); await list.settle();
  list.table().onDelete(list.table().destinations[0]); list.render();
  const pending = list.dialog().onConfirm(); list.render();
  await list.dialog().onConfirm();
  assert.equal(attempts, 1);
  assert.equal(list.dialog().isDeleting, true);
  finish(); await pending; list.render(); await list.settle();
  assert.equal(list.calls.at(-1).page, "2");
  assert.equal(list.dialog(), undefined);
  assert.deepEqual(list.notifications, ["Removed"]);
});

test("list failures clear data, show the backend error, and allow retry", async () => {
  let attempts = 0;
  const list = listHarness({ getDestinations: async () => { if (++attempts === 1) throw { message: "Service unavailable" }; return listResponse(); } });
  await list.settle();
  assert.equal(list.table().error, "Service unavailable");
  assert.equal(list.table().destinations.length, 0);
  assert.equal(list.pagination(), undefined);
  list.retry(); list.render(); await list.settle();
  assert.equal(list.table().error, "");
  assert.equal(list.table().destinations[0].title, "Jaipur");
});

test("shared upload preserves files after blur, supports replacement/discard, and releases previews", async () => {
  let index = 0;
  let nextUrl = 0;
  const slots = [];
  const effects = [];
  const revoked = [];
  const changes = [];
  const form = createFormControl({ defaultValues: { image: [] }, mode: "onTouched" });
  form.subscribe({ formState: { values: true, errors: true }, callback: () => {} });
  const inputElement = { name: "image", type: "file", files: [], get value() { return ""; }, set value(value) { if (value === "") this.files = []; } };
  const props = {
    id: "destination-image", label: "Destination image", existingImageUrl: "https://example.test/stored.png",
    selectedFile: null, inputProps: form.register("image"), disabled: false,
    onChange: (files) => { changes.push(files); form.setValue("image", files, { shouldValidate: true, shouldDirty: true }); if (files.some((file) => file.type !== "image/png")) return false; props.selectedFile = files[0] ?? null; return true; },
  };
  const Upload = loadSource("../src/components/admin/common/ImageUpload.jsx", {
    react: {
      ...React,
      useRef: (initial) => { const slot = index++; slots[slot] ??= { current: initial }; return slots[slot]; },
      useState: (initial) => { const slot = index++; if (!(slot in slots)) slots[slot] = initial; return [slots[slot], (value) => { slots[slot] = value; }]; },
      useEffect: (callback, dependencies) => {
        const slot = index++;
        const previous = slots[slot];
        if (!previous || dependencies.some((value, i) => value !== previous.dependencies[i])) {
          previous?.cleanup?.();
          slots[slot] = { callback, dependencies };
          effects.push(slots[slot]);
        }
      },
    },
    "@/components/common/ImagePreview": { __esModule: true, default: () => null, ImagePreview: () => null, getImageUrl: (value) => value },
  }, { URL: class extends URL { static createObjectURL() { return `blob:preview-${++nextUrl}`; } static revokeObjectURL(url) { revoked.push(url); } } }).default;
  let tree;
  function render() {
    index = 0; tree = Upload(props);
    walk(tree, (element) => element.type === "input").props.ref(inputElement);
    for (const effect of effects.splice(0)) effect.cleanup = effect.callback();
  }
  const preview = () => walk(tree, (element) => Boolean(element.props?.src)).props.src;
  const select = (files) => { inputElement.files = files; walk(tree, (element) => element.type === "input").props.onChange({ target: inputElement }); render(); };
  render();
  assert.equal(preview(), props.existingImageUrl);
  select([new File(["first"], "first.png", { type: "image/png" })]);
  assert.equal(preview(), "blob:preview-1");
  assert.equal(inputElement.files.length, 0);
  await walk(tree, (element) => element.type === "input").props.onBlur();
  assert.equal(form.getValues("image")[0].name, "first.png");
  walk(tree, (element) => Boolean(element.props?.onDrop)).props.onDrop({ preventDefault() {}, dataTransfer: { files: [new File(["second"], "second.png", { type: "image/png" })] } }); render();
  assert.equal(preview(), "blob:preview-2");
  await walk(tree, (element) => element.type === "input").props.onBlur();
  assert.equal(form.getValues("image")[0].name, "second.png");
  assert.deepEqual(revoked, ["blob:preview-1"]);
  select([new File(["invalid"], "image.svg", { type: "image/svg+xml" })]);
  assert.equal(preview(), "blob:preview-2");
  props.disabled = true; render();
  const count = changes.length;
  select([new File(["ignored"], "ignored.png", { type: "image/png" })]);
  assert.equal(changes.length, count);
  props.disabled = false; render();
  walk(tree, (element) => element.type === "button").props.onClick(); render();
  assert.equal(inputElement.value, "");
  assert.equal(preview(), props.existingImageUrl);
  assert.deepEqual(revoked, ["blob:preview-1", "blob:preview-2"]);
  select([new File(["last"], "last.png", { type: "image/png" })]);
  for (const slot of slots) slot?.cleanup?.();
  assert.equal(revoked.at(-1), "blob:preview-3");
});
