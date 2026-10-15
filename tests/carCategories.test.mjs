import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import { transformSync } from "@babel/core";
import * as React from "react";
import { createFormControl } from "react-hook-form";

const require = createRequire(import.meta.url);
const event = () => ({ preventDefault() {} });

function load(name, mocks) {
  const { code } = transformSync(readFileSync(new URL(`../src/components/admin/carCategories/${name}.jsx`, import.meta.url), "utf8"), {
    babelrc: false,
    configFile: false,
    plugins: [
      [require.resolve("@babel/plugin-transform-react-jsx"), { runtime: "automatic" }],
      require.resolve("@babel/plugin-transform-modules-commonjs"),
    ],
  });
  const testModule = { exports: {} };
  vm.runInNewContext(code, {
    module: testModule, exports: testModule.exports, FormData, URLSearchParams,
    require: (name) => name in mocks ? mocks[name] : require(name),
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
  return {
    react: {
      ...React,
      useState(initial) {
        const slot = index++;
        if (!(slot in slots)) slots[slot] = initial;
        return [slots[slot], (value) => { slots[slot] = typeof value === "function" ? value(slots[slot]) : value; }];
      },
      useRef(initial) {
        const slot = index++;
        slots[slot] ??= { current: initial };
        return slots[slot];
      },
      useEffect(callback, deps) {
        const slot = index++;
        if (!slots[slot] || deps.some((value, i) => value !== slots[slot].deps[i])) {
          pending.push(() => {
            slots[slot]?.cleanup?.();
            slots[slot] = { deps, cleanup: callback() };
          });
        }
      },
    },
    start() { index = 0; },
    effects() { const callbacks = pending; pending = []; callbacks.forEach((callback) => callback()); },
    cleanup() { slots.forEach((slot) => slot?.cleanup?.()); },
  };
}

function formHarness({ category = null, save = async () => ({ message: "Saved" }) } = {}) {
  const state = hooks();
  const calls = [];
  const routes = [];
  const focused = [];
  const notifications = [];
  let form;
  let formState = { errors: {}, isSubmitting: false };
  const component = load("CarCategoryForm", {
    react: state.react,
    "react-hook-form": {
      useForm(options) {
        if (!form) {
          form = createFormControl({ ...options, defaultValues: JSON.parse(JSON.stringify(options.defaultValues)) });
          form.subscribe({ formState: { errors: true, isSubmitting: true }, callback: (value) => { formState = value; } });
        }
        return {
          ...form, formState, setFocus: (name) => focused.push(name),
          register(name, rules) {
            if (rules?.pattern?.value) rules = { ...rules, pattern: { ...rules.pattern, value: new RegExp(rules.pattern.value.source) } };
            const registration = form.register(name, rules);
            registration.ref({ name, type: name === "image" ? "file" : "text", value: form.getValues(name) ?? "" });
            return registration;
          },
        };
      },
    },
    "@/lib/apis": { __esModule: true, default: { admin: { carRental: {
      createCategory: async (data) => { calls.push({ data }); return save(data); },
      updateCategory: async (id, data) => { calls.push({ id, data }); return save(data); },
    } } } },
    "@/i18n/navigation": { useRouter: () => ({ push: (route) => routes.push(route) }) },
    "react-hot-toast": { __esModule: true, default: { success: (text) => notifications.push(text), error: (text) => notifications.push(text) } },
    "@/icons": { ChevronLeftIcon: "ChevronLeftIcon" },
    "@/components/admin/common/PageBreadCrumb": "Breadcrumb",
    "@/components/admin/common/ImageUpload": "ImageUpload",
  });
  function render() { state.start(); const tree = component({ category }); state.effects(); return tree; }
  render();
  return { form, calls, routes, focused, notifications, render, submit: () => find(render(), (node) => node.type === "form").props.onSubmit(event()) };
}

test("category form validates required title, slug format, and upload size before sending a request", async () => {
  const h = formHarness();
  await h.submit();
  assert.equal(h.calls.length, 0);
  assert.ok(h.form.control._formState.errors.title);
  h.form.setValue("title", "Sedan");
  h.form.setValue("slug", "Not a slug");
  await h.submit();
  assert.equal(h.calls.length, 0);
  assert.ok(h.form.control._formState.errors.slug);
  h.form.setValue("slug", "sedan");
  h.form.setValue("image", [new File([new Uint8Array(2 * 1024 * 1024 + 1)], "car.png", { type: "image/png" })]);
  await h.submit();
  assert.equal(h.calls.length, 0);
  assert.match(h.form.control._formState.errors.image.message, /2 MB/);
});

test("creation submits multipart category fields and redirects to the freshly fetched list", async () => {
  const h = formHarness();
  h.form.setValue("title", " Sedan ");
  h.form.setValue("slug", "sedan");
  h.form.setValue("meta_keyword", "car rental, sedan");
  const file = new File(["image"], "sedan.webp", { type: "image/webp" });
  h.form.setValue("image", [file]);
  await h.submit();
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].data.get("title"), "Sedan");
  assert.equal(h.calls[0].data.get("meta_keyword"), "car rental, sedan");
  assert.equal(h.calls[0].data.get("status"), "1");
  assert.equal(h.calls[0].data.get("image").name, "sedan.webp");
  assert.deepEqual(h.routes, ["/admin/car-categories"]);
});

test("editing preserves inactive status and does not replace the existing image without an upload", async () => {
  const h = formHarness({ category: { id: 7, title: "SUV", slug: "suv", status: false, image_url: "https://example.test/suv.png" } });
  await h.submit();
  assert.equal(h.calls[0].id, 7);
  assert.equal(h.calls[0].data.get("status"), "0");
  assert.equal(h.calls[0].data.has("image"), false);
  assert.equal(h.calls[0].data.has("image_url"), false);
});

test("slug follows the title until customized and existing slugs stay unchanged", async () => {
  const h = formHarness();
  const change = async (name, value) => {
    const input = find(h.render(), (node) => node.type === "input" && node.props.name === name);
    await input.props.onChange({ type: "change", target: { name, value } });
  };
  await change("title", "Tempo Traveller");
  assert.equal(h.form.getValues("slug"), "tempo-traveller");
  await change("slug", "custom-van");
  await change("title", "Luxury Van");
  assert.equal(h.form.getValues("slug"), "custom-van");
  const edit = formHarness({ category: { id: 1, title: "SUV", slug: "original-suv", status: true } });
  const input = find(edit.render(), (node) => node.type === "input" && node.props.name === "title");
  await input.props.onChange({ type: "change", target: { name: "title", value: "Luxury SUV" } });
  assert.equal(edit.form.getValues("slug"), "original-suv");
});

test("pending saves reject duplicate submissions and guard Cancel", async () => {
  let resolve;
  const h = formHarness({ save: () => new Promise((done) => { resolve = done; }) });
  h.form.setValue("title", "Sedan");
  h.form.setValue("slug", "sedan");
  const pending = h.submit();
  await new Promise(setImmediate);
  await h.submit();
  find(h.render(), (node) => node.type === "button" && node.props.children === "Cancel").props.onClick();
  assert.equal(h.calls.length, 1);
  assert.equal(h.routes.length, 0);
  resolve({ message: "Created" });
  await pending;
  assert.deepEqual(h.routes, ["/admin/car-categories"]);
});

test("backend field and unmapped errors retain input and focus the failing field after submission", async () => {
  const h = formHarness({ save: async () => { throw { message: "Validation failed.", errors: { slug: ["Slug already exists."], other: ["Additional backend detail."] } }; } });
  h.form.setValue("title", "Sedan");
  h.form.setValue("slug", "sedan");
  await h.submit();
  h.render();
  assert.equal(h.form.getValues("title"), "Sedan");
  assert.equal(h.form.control._formState.errors.slug.message, "Slug already exists.");
  assert.match(h.form.control._formState.errors.root.server.message, /Additional backend detail/);
  assert.deepEqual(h.focused, ["slug"]);
  assert.equal(h.routes.length, 0);
});

test("car count comes from filtered backend pagination and ignores responses after unmount", async () => {
  const state = hooks();
  const requests = [];
  let resolve;
  const component = load("CarCategoryCarCount", {
    react: state.react,
    "@/icons": { ArrowRightIcon: "ArrowRightIcon" },
    "@/lib/apis": { __esModule: true, default: { admin: { carRental: { getCars: (params) => { requests.push(params); return new Promise((done) => { resolve = done; }); } } } } },
  });
  const render = () => { state.start(); return component({ category: { id: 8, title: "Sedan" } }); };
  render(); state.effects();
  assert.equal(requests[0].car_category_id, 8);
  assert.equal(requests[0].per_page, 1);
  state.cleanup();
  resolve({ pagination: { total: 123 } });
  await new Promise(setImmediate);
  assert.ok(find(render(), (node) => node.type === "p" && node.props.children === "Loading..."));
});

test("list forwards filters and page size, resets filters to page one, and refreshes after deletion", async () => {
  const state = hooks();
  const requests = [];
  const deleted = [];
  const category = { id: 9, title: "Sedan" };
  const component = load("CarCategoryList", {
    react: state.react,
    "react-hot-toast": { __esModule: true, default: { success() {}, error() {} } },
    "@/components/admin/common/PageBreadCrumb": "Breadcrumb",
    "@/components/admin/tables/Pagination": "Pagination",
    "./CarCategoryFilters": "Filters",
    "./CarCategoryTable": "CategoryTable",
    "./DeleteCarCategoryDialog": "DeleteDialog",
    "./CarCategoryCarsDialog": "CarsDialog",
    "@/lib/apis": { __esModule: true, default: { admin: { carRental: {
      getCategories: async (params) => {
        const request = Object.fromEntries(params);
        requests.push(request);
        return { data: [category], pagination: { current_page: Number(request.page), last_page: 2, per_page: 10, total: 11, from: 1, to: 1 } };
      },
      deleteCategory: async (id) => { deleted.push(id); return { message: "Deleted" }; },
    } } } },
  });
  const render = () => { state.start(); const tree = component(); state.effects(); return tree; };
  render();
  await new Promise(setImmediate);
  find(render(), (node) => node.type === "Pagination").props.onPageChange(2);
  render();
  await new Promise(setImmediate);
  assert.equal(requests.at(-1).page, "2");
  find(render(), (node) => node.type === "Filters").props.onSearch({ keyword: "sedan", status: "0" });
  render();
  await new Promise(setImmediate);
  assert.deepEqual(requests.at(-1), { page: "1", per_page: "10", keyword: "sedan", status: "0" });
  find(render(), (node) => node.type === "Pagination").props.onPageChange(2);
  render();
  await new Promise(setImmediate);
  find(render(), (node) => node.type === "CategoryTable").props.onDelete(category);
  await find(render(), (node) => node.type === "DeleteDialog").props.onConfirm();
  render();
  await new Promise(setImmediate);
  assert.deepEqual(deleted, [9]);
  assert.equal(requests.at(-1).page, "1");
  assert.equal(find(render(), (node) => node.type === "DeleteDialog"), null);
});
