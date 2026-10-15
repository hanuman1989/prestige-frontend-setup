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
  const filename = name.includes(".") ? name : `${name}.jsx`;
  const { code } = transformSync(readFileSync(new URL(`../src/components/admin/cars/${filename}`, import.meta.url), "utf8"), {
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

function formHarness({
  car = null,
  save = async () => ({ message: "Saved" }),
  categoryLookup = () => ({ categories: [{ id: 8, title: "Sedan", status: true }], isLoading: false, error: "", retry() {} }),
} = {}) {
  const state = hooks();
  const calls = [];
  const routes = [];
  const focused = [];
  const notifications = [];
  let form;
  let formState = { errors: {}, isSubmitting: false };
  const component = load("CarForm", {
    react: state.react,
    "react-hook-form": {
      useWatch: ({ name }) => form.getValues(name),
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
            registration.ref({ name, type: ["has_ac", "is_featured"].includes(name) ? "checkbox" : name === "image" ? "file" : "text", checked: Boolean(form.getValues(name)), value: form.getValues(name) ?? "" });
            return registration;
          },
        };
      },
    },
    "@/lib/apis": { __esModule: true, default: { admin: { carRental: {
      createCar: async (data) => { calls.push({ data }); return save(data); },
      updateCar: async (id, data) => { calls.push({ id, data }); return save(data); },
    } } } },
    "@/i18n/navigation": { Link: "Link", useRouter: () => ({ push: (route) => routes.push(route) }) },
    "react-hot-toast": { __esModule: true, default: { success: (text) => notifications.push(text), error: (text) => notifications.push(text) } },
    "@/icons": { ChevronLeftIcon: "ChevronLeftIcon" },
    "./useCarCategories": { __esModule: true, default: categoryLookup },
    "@/components/admin/common/PageBreadCrumb": "Breadcrumb",
    "@/components/admin/common/ImageUpload": "ImageUpload",
  });
  function render() { state.start(); const tree = component({ car }); state.effects(); return tree; }
  render();
  return { form, calls, routes, focused, notifications, render, submit: () => find(render(), (node) => node.type === "form").props.onSubmit(event()) };
}

function fillRequired(h) {
  h.form.setValue("title", "Innova Crysta");
  h.form.setValue("slug", "innova-crysta");
  h.form.setValue("car_category_id", "8");
  h.form.setValue("passenger_seats", "6");
  h.form.setValue("starting_rate", "22.50");
}

for (const savedCategoryId of [8, "8"]) {
  test(`edit category stays selected after options load for ${typeof savedCategoryId} IDs`, async () => {
    const lookup = { categories: [], isLoading: true, error: "", retry() {} };
    const h = formHarness({
      car: { id: 12, title: "Sedan", slug: "sedan", car_category_id: savedCategoryId, passenger_seats: 4, starting_rate: "12.00" },
      categoryLookup: () => lookup,
    });
    const select = () => find(h.render(), (node) => node.type === "select" && node.props.name === "car_category_id");
    assert.equal(select().props.value, "8");
    assert.equal(select().props.disabled, true);

    lookup.categories = [{ id: 8, title: "Sedan", status: true }, { id: 9, title: "SUV", status: true }];
    lookup.isLoading = false;
    assert.equal(select().props.value, "8");
    assert.equal(select().props.disabled, false);
    const selected = select();
    assert.ok(find(selected, (node) => node.type === "option" && String(node.props.value) === selected.props.value));

    await select().props.onChange({ type: "change", target: { name: "car_category_id", value: "9" } });
    lookup.categories = [...lookup.categories];
    assert.equal(select().props.value, "9");
    await h.submit();
    assert.equal(h.calls[0].data.get("car_category_id"), "9");
  });
}

test("required fields and numeric bounds are validated before a car is saved", async () => {
  const h = formHarness();
  await h.submit();
  assert.equal(h.calls.length, 0);
  assert.ok(h.form.control._formState.errors.car_category_id);
  assert.ok(h.form.control._formState.errors.passenger_seats);
  assert.ok(h.form.control._formState.errors.starting_rate);
  fillRequired(h);
  h.form.setValue("passenger_seats", "0");
  h.form.setValue("starting_rate", "22.555");
  h.form.setValue("minimum_km_per_day", "2.5");
  h.form.setValue("driver_allowance_per_day", "-1");
  h.form.setValue("extra_km_rate", "100000000");
  await h.submit();
  assert.equal(h.calls.length, 0);
  for (const field of ["passenger_seats", "starting_rate", "minimum_km_per_day", "driver_allowance_per_day", "extra_km_rate"]) {
    assert.ok(h.form.control._formState.errors[field], field);
  }
});

test("multipart creation preserves zero rates, optional empty pricing, and boolean switches", async () => {
  const h = formHarness();
  fillRequired(h);
  h.form.setValue("starting_rate", "0");
  h.form.setValue("has_ac", false);
  h.form.setValue("is_featured", true);
  h.form.setValue("luggage_bags", "");
  h.form.setValue("image", [new File(["image"], "car.webp", { type: "image/webp" })]);
  await h.submit();
  assert.equal(h.calls.length, 1);
  const data = h.calls[0].data;
  assert.equal(data.get("car_category_id"), "8");
  assert.equal(data.get("starting_rate"), "0");
  assert.equal(data.get("minimum_km_per_day"), "");
  assert.equal(data.get("driver_allowance_per_day"), "");
  assert.equal(data.get("extra_km_rate"), "");
  assert.equal(data.get("has_ac"), "0");
  assert.equal(data.get("is_featured"), "1");
  assert.equal(data.get("luggage_bags"), "0");
  assert.equal(data.get("image").name, "car.webp");
  assert.deepEqual(h.routes, ["/admin/cars"]);
});

test("editing preserves inactive and false values, clears nullable pricing, and retains the existing image", async () => {
  const h = formHarness({ car: {
    id: 12, title: "Luxury Van", slug: "luxury-van", car_category_id: 8,
    passenger_seats: 12, starting_rate: "8000.00", rate_basis: "per_day",
    has_ac: false, is_featured: false, status: false, driver_allowance_per_day: "300.00",
    image_url: "https://example.test/van.png",
  } });
  h.form.setValue("driver_allowance_per_day", "");
  await h.submit();
  assert.equal(h.calls[0].id, 12);
  const data = h.calls[0].data;
  assert.equal(data.get("rate_basis"), "per_day");
  assert.equal(data.get("status"), "0");
  assert.equal(data.get("has_ac"), "0");
  assert.equal(data.get("is_featured"), "0");
  assert.equal(data.get("driver_allowance_per_day"), "");
  assert.equal(data.has("image"), false);
  assert.equal(data.has("image_url"), false);
});

test("slugs follow titles until customized and stay unchanged on edit", async () => {
  const h = formHarness();
  const change = async (name, value) => {
    const input = find(h.render(), (node) => node.type === "input" && node.props.name === name);
    await input.props.onChange({ type: "change", target: { name, value } });
  };
  await change("title", "Toyota Innova Crysta");
  assert.equal(h.form.getValues("slug"), "toyota-innova-crysta");
  await change("slug", "custom-car");
  await change("title", "Luxury Van");
  assert.equal(h.form.getValues("slug"), "custom-car");
  const edit = formHarness({ car: { id: 1, title: "SUV", slug: "original-suv" } });
  const input = find(edit.render(), (node) => node.type === "input" && node.props.name === "title");
  await input.props.onChange({ type: "change", target: { name: "title", value: "Luxury SUV" } });
  assert.equal(edit.form.getValues("slug"), "original-suv");
});

test("image validation rejects unsupported files and files larger than 2 MB", async () => {
  const h = formHarness();
  fillRequired(h);
  h.form.setValue("image", [new File(["image"], "car.svg", { type: "image/svg+xml" })]);
  await h.submit();
  assert.match(h.form.control._formState.errors.image.message, /PNG, JPG or WebP/);
  h.form.setValue("image", [new File([new Uint8Array(2 * 1024 * 1024 + 1)], "car.png", { type: "image/png" })]);
  await h.submit();
  assert.match(h.form.control._formState.errors.image.message, /2 MB/);
  assert.equal(h.calls.length, 0);
});

test("pending saves reject duplicates and prevent navigation through Cancel", async () => {
  let resolve;
  const h = formHarness({ save: () => new Promise((done) => { resolve = done; }) });
  fillRequired(h);
  const pending = h.submit();
  await new Promise(setImmediate);
  await h.submit();
  find(h.render(), (node) => node.type === "button" && node.props.children === "Cancel").props.onClick();
  assert.equal(h.calls.length, 1);
  assert.equal(h.routes.length, 0);
  resolve({ message: "Created" });
  await pending;
  assert.deepEqual(h.routes, ["/admin/cars"]);
});

test("backend field and general errors retain form values and focus the first failing field", async () => {
  const h = formHarness({ save: async () => { throw {
    message: "Validation failed.", errors: { starting_rate: ["The starting rate is invalid."], unknown: ["Backend detail."] },
  }; } });
  fillRequired(h);
  await h.submit();
  h.render();
  assert.equal(h.form.getValues("title"), "Innova Crysta");
  assert.equal(h.form.control._formState.errors.starting_rate.message, "The starting rate is invalid.");
  assert.match(h.form.control._formState.errors.root.server.message, /Backend detail/);
  assert.deepEqual(h.focused, ["starting_rate"]);
  assert.equal(h.routes.length, 0);
});

test("category lookup loads all pages and ignores a late response after cleanup", async () => {
  const state = hooks();
  const requests = [];
  let resolveLast;
  const component = load("useCarCategories.js", {
    react: state.react,
    "react-hot-toast": { __esModule: true, default: { error() {} } },
    "@/lib/apis": { __esModule: true, default: { admin: { carRental: {
      getCategories: async (params) => {
        requests.push(params);
        if (params.page === 1) return { data: [{ id: 1 }], pagination: { last_page: 2 } };
        return new Promise((resolve) => { resolveLast = resolve; });
      },
    } } } },
  });
  const render = () => { state.start(); const result = component(); state.effects(); return result; };
  render();
  await new Promise(setImmediate);
  assert.equal(requests.length, 2);
  assert.equal(requests[1].page, 2);
  assert.equal(requests[1].per_page, 100);
  state.cleanup();
  resolveLast({ data: [{ id: 2 }], pagination: { last_page: 2 } });
  await new Promise(setImmediate);
  assert.equal(render().categories.length, 0);
});

test("list forwards keyword, category and inactive status, resets pagination, and refreshes after deletion", async () => {
  const state = hooks();
  const requests = [];
  const deleted = [];
  const car = { id: 9, title: "Sedan" };
  const component = load("CarList", {
    react: state.react,
    "react-hot-toast": { __esModule: true, default: { success() {}, error() {} } },
    "@/components/admin/common/PageBreadCrumb": "Breadcrumb",
    "@/components/admin/tables/Pagination": "Pagination",
    "./CarFilters": "Filters",
    "./CarTable": "CarTable",
    "./DeleteCarDialog": "DeleteDialog",
    "@/lib/apis": { __esModule: true, default: { admin: { carRental: {
      getCars: async (params) => {
        const request = Object.fromEntries(params);
        requests.push(request);
        return { data: [car], pagination: { current_page: Number(request.page), last_page: 2, per_page: 6, total: 7, from: 1, to: 1 } };
      },
      deleteCar: async (id) => { deleted.push(id); return { message: "Deleted" }; },
    } } } },
  });
  const render = () => { state.start(); const tree = component(); state.effects(); return tree; };
  render();
  await new Promise(setImmediate);
  find(render(), (node) => node.type === "Pagination").props.onPageChange(2);
  render();
  await new Promise(setImmediate);
  assert.equal(requests.at(-1).page, "2");
  find(render(), (node) => node.type === "Filters").props.onSearch({ keyword: "sedan", car_category_id: "8", status: "0" });
  render();
  await new Promise(setImmediate);
  assert.deepEqual(requests.at(-1), { page: "1", per_page: "6", keyword: "sedan", car_category_id: "8", status: "0" });
  find(render(), (node) => node.type === "Pagination").props.onPageChange(2);
  render();
  await new Promise(setImmediate);
  find(render(), (node) => node.type === "CarTable").props.onDelete(car);
  await find(render(), (node) => node.type === "DeleteDialog").props.onConfirm();
  render();
  await new Promise(setImmediate);
  assert.deepEqual(deleted, [9]);
  assert.equal(requests.at(-1).page, "1");
  assert.equal(find(render(), (node) => node.type === "DeleteDialog"), null);
});

