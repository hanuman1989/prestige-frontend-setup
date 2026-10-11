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

function loadSource(path, mocks = {}) {
  const { code } = transformSync(readFileSync(new URL(path, import.meta.url), "utf8"), {
    babelrc: false, configFile: false,
    plugins: [[require.resolve("@babel/plugin-transform-react-jsx"), { runtime: "automatic" }], require.resolve("@babel/plugin-transform-modules-commonjs")],
  });
  const testModule = { exports: {} };
  vm.runInNewContext(code, {
    module: testModule, exports: testModule.exports,
    require: (name) => name in mocks ? mocks[name] : require(name),
    URL, FormData,
  });
  return testModule.exports;
}

test("category CRUD uses the shared Axios client and preserves responses and payloads", async () => {
  const calls = [];
  const response = { data: { data: [], pagination: { total: 0 }, message: "Saved" } };
  const client = Object.fromEntries(["get", "post", "put", "delete"].map((method) => [method, async (...args) => {
    calls.push([method, ...args]);
    return response;
  }]));
  const api = loadSource("../src/lib/apis/admin/categories.js", { "@/lib/axios": { __esModule: true, default: client } }).default;
  const params = new URLSearchParams({ page: "2", per_page: "6", keyword: "heritage", status: "0" });
  const data = new FormData(); data.append("title", "Heritage");
  assert.equal(await api.getCategories(params), response.data);
  assert.equal(await api.getCategory(9), response.data);
  assert.equal(await api.createCategory(data), response.data);
  assert.equal(await api.updateCategory(9, data), response.data);
  assert.equal(await api.deleteCategory(9), response.data);
  assert.deepEqual(calls.map(([method, url]) => [method, url]), [
    ["get", "/admin/categories"], ["get", "/admin/categories/9"], ["post", "/admin/categories"], ["post", "/admin/categories/9"], ["delete", "/admin/categories/9"],
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
  const api = loadSource("../src/lib/apis/admin/categories.js", { "@/lib/axios": { __esModule: true, default: client } }).default;
  const data = new FormData();
  data.append("title", "Updated category");
  data.append("status", "0");
  data.append("image", new File(["replacement-image"], "replacement.png", { type: "image/png" }));
  data.set("_method", "PATCH");
  await api.updateCategory(9, data);
  assert.equal(calls[0].method, "post");
  assert.equal(calls[0].url, "/admin/categories/9");
  assert.equal(calls[0].config.headers["Content-Type"], "multipart/form-data");
  assert.deepEqual(calls[0].data.getAll("_method"), ["PUT"]);
  assert.equal(calls[0].data.get("status"), "0");
  assert.equal(calls[0].data.get("image").name, "replacement.png");
  assert.equal(calls[0].data.get("image").type, "image/png");
  assert.equal(await calls[0].data.get("image").text(), "replacement-image");
  assert.equal(data.get("_method"), "PATCH");
  const json = { title: "Text-only update", status: false };
  await api.updateCategory(9, json);
  assert.equal(calls[1].method, "put");
  assert.equal(calls[1].data, json);
});

test("category API preserves backend validation and permission errors with fallback messages", async () => {
  const validation = { message: "Validation failed", errors: { slug: ["Already taken"] } };
  const client = {
    post: async () => { throw { response: { data: validation } }; },
    delete: async () => { throw { response: { data: { message: "Forbidden" } } }; },
    get: async () => { throw new Error("Network error"); },
  };
  const api = loadSource("../src/lib/apis/admin/categories.js", { "@/lib/axios": { __esModule: true, default: client } }).default;
  await assert.rejects(api.createCategory(new FormData()), (error) => error === validation);
  await assert.rejects(api.deleteCategory(9), (error) => error.message === "Forbidden");
  await assert.rejects(api.getCategory(9), (error) => error.message === "Failed to fetch category");
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

function formHarness({ category = null, save } = {}) {
  let index = 0;
  const slots = [];
  let form;
  let formState = { errors: {}, isSubmitting: false };
  let tree;
  const requests = [];
  const navigation = [];
  const notifications = [];
  const api = {
    createCategory: async (data) => { requests.push(["create", data]); return save ? save(data) : { message: "Created" }; },
    updateCategory: async (id, data) => { requests.push(["update", id, data]); return save ? save(data) : { message: "Updated" }; },
  };
  const reactMock = {
    ...React,
    useRef: (initial) => { const slot = index++; slots[slot] ??= { current: initial }; return slots[slot]; },
    useState: (initial) => { const slot = index++; if (!(slot in slots)) slots[slot] = initial; return [slots[slot], (next) => { slots[slot] = typeof next === "function" ? next(slots[slot]) : next; }]; },
    useEffect: () => {},
  };
  const exports = loadSource("../src/components/admin/categories/CategoryForm.jsx", {
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
    "@/lib/apis": { __esModule: true, default: { admin: { categories: api } } },
    "@/i18n/navigation": { useRouter: () => ({ push: (url) => navigation.push(url) }) },
    "react-hot-toast": { __esModule: true, default: { success: (message) => notifications.push(message), error: (message) => notifications.push(message) } },
    "@/icons": { ChevronLeftIcon: () => React.createElement("svg") },
    "@/components/admin/common/PageBreadCrumb": { __esModule: true, default: ({ pageTitle }) => React.createElement("h1", null, pageTitle) },
    "@/components/admin/common/ImageUpload": { __esModule: true, default: ({ existingImageUrl, label }) => React.createElement("img", { src: existingImageUrl, alt: label }), ImagePreview: ({ src, alt }) => React.createElement("img", { src, alt }) },
  });
  function render() { index = 0; tree = exports.default({ category }); return tree; }
  render();
  return {
    form, requests, navigation, notifications, render,
    slug: exports.generateCategorySlug,
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
  const edit = formHarness({ category: { id: 9, title: "Original", slug: "custom-original", status: false, image_url: "https://example.test/existing.png" } });
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
  assert.equal(data.get("meta_keyword"), "forts, luxury");
  assert.deepEqual([...data.keys()].sort(), ["description", "meta_description", "meta_keyword", "meta_title", "slug", "status", "title"]);
  assert.deepEqual(form.navigation, ["/admin/categories"]);
  assert.deepEqual(form.notifications, ["Created"]);
});

test("edit omits unchanged image and sends a replacement file only when selected", async () => {
  const category = { id: 9, title: "Heritage", slug: "heritage", status: true, image_url: "https://example.test/stored.png" };
  const form = formHarness({ category });
  await form.submit(); assert.equal(form.requests[0][2].has("image"), false);
  form.form.setValue("image", [new File(["binary"], "replacement.png", { type: "image/png" })]);
  await form.submit(); assert.equal(form.requests[1][2].get("image").name, "replacement.png");
  assert.equal(form.requests[1][2].has("id"), false);
});

test("stored images are retained and are not offered an unsupported removal action", () => {
  const form = formHarness({ category: { id: 9, title: "Heritage", slug: "heritage", status: true, image_url: "https://example.test/stored.png" } });
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
  assert.equal(attempts, 2); assert.deepEqual(form.navigation, ["/admin/categories"]);
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

test("category table renders boolean statuses and public image URLs without a status helper", () => {
  const wrapper = ({ children }) => React.createElement("div", null, children);
  const table = loadSource("../src/components/admin/categories/CategoryTable.jsx", {
    "@headlessui/react": { Menu: wrapper, MenuButton: wrapper, MenuItem: wrapper, MenuItems: wrapper },
    "@/i18n/navigation": { Link: ({ href, children }) => React.createElement("a", { href }, children) },
    "@/icons": { MoreDotIcon: wrapper, PencilIcon: wrapper, PlusIcon: wrapper, TrashBinIcon: wrapper },
    "@/components/admin/ui/table": { Table: wrapper, TableBody: wrapper, TableCell: wrapper, TableHeader: wrapper, TableRow: wrapper },
    "@/components/admin/common/ImageUpload": { __esModule: true, default: ({ existingImageUrl, label }) => React.createElement("img", { src: existingImageUrl, alt: label }), ImagePreview: ({ src, alt }) => React.createElement("img", { src, alt }) },
  }).default;
  const html = renderToStaticMarkup(React.createElement(table, {
    categories: [
      { id: 1, title: "Heritage", slug: "heritage", status: true, image: "categories/stored.png", image_url: "https://example.test/public.png" },
      { id: 2, title: "Hidden", slug: "hidden", status: false },
    ], total: 2,
  }));
  assert.match(html, />Active</);
  assert.match(html, />Inactive</);
  assert.match(html, /https:\/\/example\.test\/public\.png/);
  assert.doesNotMatch(html, /categories\/stored\.png/);
});
