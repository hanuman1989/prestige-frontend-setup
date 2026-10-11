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
function loadSource(path, mocks) {
  const { code } = transformSync(readFileSync(new URL(path, import.meta.url), "utf8"), {
    babelrc: false, configFile: false,
    plugins: [[require.resolve("@babel/plugin-transform-react-jsx"), { runtime: "automatic" }], require.resolve("@babel/plugin-transform-modules-commonjs")],
  });
  const testModule = { exports: {} };
  vm.runInNewContext(code, { module: testModule, exports: testModule.exports, require: (name) => name in mocks ? mocks[name] : require(name) });
  return testModule.exports.default;
}
function find(element, predicate) {
  if (!element || typeof element !== "object") return null;
  if (predicate(element)) return element;
  for (const child of React.Children.toArray(element.props?.children)) {
    const found = find(child, predicate);
    if (found) return found;
  }
  return null;
}
function hooks() {
  let index = 0;
  const slots = [];
  return {
    reset: () => { index = 0; },
    react: {
      ...React,
      useEffect: () => {},
      useRef: (value) => { const i = index++; slots[i] ??= { current: value }; return slots[i]; },
      useState: (value) => { const i = index++; if (!(i in slots)) slots[i] = value; return [slots[i], (next) => { slots[i] = typeof next === "function" ? next(slots[i]) : next; }]; },
    },
  };
}
function dialogHarness(onUpdate = async () => {}) {
  const hook = hooks();
  let form;
  let state = { errors: {}, isSubmitting: false };
  let tree;
  let closed = 0;
  const wrapper = ({ children }) => React.createElement("div", null, children);
  const Dialog = loadSource("../src/components/admin/adminUsers/ChangePasswordDialog.jsx", {
    react: hook.react,
    "@headlessui/react": Object.fromEntries(["Dialog", "DialogBackdrop", "DialogPanel", "DialogTitle", "Description"].map((key) => [key, wrapper])),
    "@/icons": { CloseIcon: () => React.createElement("svg") },
    "react-hook-form": { useForm: (options) => {
      if (!form) {
        form = createFormControl(options);
        form.subscribe({ formState: { values: true, errors: true, isSubmitting: true }, callback: (next) => { state = next; } });
      }
      return { ...form, formState: state, register: (name, rules) => {
        const field = form.register(name, rules);
        field.ref({ name, type: "password", value: form.getValues(name) ?? "", focus() {} });
        return field;
      } };
    } },
  });
  function render() { hook.reset(); tree = Dialog({ user: { id: 9, full_name: "Example Admin" }, onClose: () => { closed++; }, onUpdate }); }
  render();
  return {
    form, render,
    closed: () => closed,
    html: () => renderToStaticMarkup(tree),
    submit: () => find(tree, (el) => el.type === "form").props.onSubmit({ preventDefault() {}, persist() {} }),
    cancel: () => find(tree, (el) => el.type === "button" && el.props.children === "Cancel").props.onClick(),
    closeButton: () => find(tree, (el) => el.props?.["aria-label"] === "Close change password form").props,
    cancelButton: () => find(tree, (el) => el.type === "button" && el.props.children === "Cancel").props,
    blur: async (name, dismissing = false) => {
      let stopped = false;
      find(tree, (el) => el.props?.onBlurCapture).props.onBlurCapture({
        relatedTarget: { closest: () => dismissing ? {} : null },
        stopPropagation: () => { stopped = true; },
      });
      if (!stopped) await find(tree, (el) => el.props?.name === name).props.onBlur({ type: "blur", target: { name, value: form.getValues(name) } });
      return stopped;
    },
  };
}

test("close and cancel skip blur validation and clear existing form errors", async () => {
  for (const action of ["closeButton", "cancelButton"]) {
    let updates = 0;
    const h = dialogHarness(async () => { updates++; });
    let prevented = false;
    h[action]().onMouseDown({ preventDefault: () => { prevented = true; } });
    assert.equal(prevented, true);
    assert.equal(await h.blur("password", true), true);
    assert.equal(h.form.getFieldState("password").error, undefined);
    await h.submit();
    assert.ok(h.form.getFieldState("password").error);
    h[action]().onClick(); h.render();
    assert.equal(h.closed(), 1);
    assert.equal(h.form.getFieldState("password").error, undefined);
    assert.equal(h.form.getFieldState("password_confirmation").error, undefined);
    assert.equal(await h.blur("password"), true);
    assert.equal(updates, 0);
  }
});

test("normal field blur still validates touched password inputs", async () => {
  const h = dialogHarness();
  assert.equal(await h.blur("password"), false);
  assert.ok(h.form.getFieldState("password").error);
});

test("password fields are required, enforce backend lengths and require a matching confirmation", async () => {
  let updates = 0;
  const h = dialogHarness(async () => { updates++; });
  const inputs = h.html().match(/<input[^>]*>/g);
  assert.equal(inputs.length, 2);
  inputs.forEach((input) => { assert.match(input, /type="password"/); assert.match(input, /aria-required="true"/); });
  await h.submit();
  assert.ok(h.form.getFieldState("password").error);
  assert.ok(h.form.getFieldState("password_confirmation").error);
  for (const password of ["short", "x".repeat(256)]) {
    h.form.setValue("password", password); h.form.setValue("password_confirmation", password);
    await h.submit(); assert.ok(h.form.getFieldState("password").error);
  }
  h.form.setValue("password", "valid-password"); h.form.setValue("password_confirmation", "different-password");
  await h.submit(); assert.equal(h.form.getFieldState("password_confirmation").error.message, "Passwords must match.");
  assert.equal(updates, 0);
});

test("valid submission sends only the two password fields and preserves whitespace", async () => {
  let payload;
  const h = dialogHarness(async (values) => { payload = values; });
  const password = " password-example ";
  h.form.setValue("password", password); h.form.setValue("password_confirmation", password);
  await h.submit();
  assert.deepEqual(Object.keys(payload).sort(), ["password", "password_confirmation"]);
  assert.equal(payload.password, password);
  assert.equal(payload.password_confirmation, password);
});

test("backend field and general errors preserve values and allow correction", async () => {
  let attempts = 0;
  const h = dialogHarness(async () => {
    if (++attempts === 1) throw { message: "Validation failed", errors: { password: ["Choose another password"], general: ["Please retry"] } };
  });
  h.form.setValue("password", "valid-password"); h.form.setValue("password_confirmation", "valid-password");
  await h.submit(); h.render();
  assert.equal(h.form.getFieldState("password").error.message, "Choose another password");
  assert.match(h.html(), /Please retry/);
  assert.equal(h.form.getValues("password"), "valid-password");
  h.form.setValue("password", "updated-password"); h.form.setValue("password_confirmation", "updated-password");
  await h.submit(); assert.equal(attempts, 2);
});

test("pending updates disable controls and block duplicate submit and closing", async () => {
  let finish, started, updates = 0;
  const pending = new Promise((resolve) => { finish = resolve; });
  const ready = new Promise((resolve) => { started = resolve; });
  const h = dialogHarness(async () => { updates++; started(); await pending; });
  h.form.setValue("password", "valid-password"); h.form.setValue("password_confirmation", "valid-password");
  const saving = h.submit(); await ready; h.render();
  assert.match(h.html(), /disabled=""[^>]*>Changing\.\.\./);
  await h.submit(); h.cancel(); assert.equal(updates, 1); assert.equal(h.closed(), 0);
  finish(); await saving; h.render(); h.cancel(); assert.equal(h.closed(), 1);
});

test("password API uses the dedicated PATCH endpoint and preserves response and backend errors", async () => {
  const payload = { password: "valid-password", password_confirmation: "valid-password" };
  const response = { message: "Updated" };
  let called;
  const api = loadSource("../src/lib/apis/admin/adminUsers.js", {
    "@/lib/axios": { __esModule: true, default: { patch: async (...args) => { called = args; return { data: response }; } } },
  });
  assert.equal(await api.changePassword(9, payload), response);
  assert.equal(called[0], "/admin/admin-users/9/password"); assert.equal(called[1], payload);
  const error = { message: "Rejected", errors: { password: ["Invalid"] } };
  const failed = loadSource("../src/lib/apis/admin/adminUsers.js", {
    "@/lib/axios": { __esModule: true, default: { patch: async () => { throw { response: { data: error } }; } } },
  });
  await assert.rejects(failed.changePassword(9, payload), (failure) => failure === error);
});

function adminHarness(changePassword, signedInId = 1) {
  const hook = hooks();
  let tree, loggedOut = 0;
  const notifications = [];
  const stub = () => null;
  const Table = () => null;
  const PasswordDialog = () => null;
  const Component = loadSource("../src/components/admin/adminUsers/AdminUsers.jsx", {
    react: hook.react,
    "react-hot-toast": { __esModule: true, default: { success: (message) => notifications.push(["success", message]), error: (message) => notifications.push(["error", message]) } },
    "@/components/admin/common/PageBreadCrumb": { __esModule: true, default: stub },
    "@/components/admin/tables/Pagination": { __esModule: true, default: stub },
    "./AdminUserFilters": { __esModule: true, default: stub },
    "./AdminUsersTable": { __esModule: true, default: Table },
    "./DeleteAdminUserDialog": { __esModule: true, default: stub },
    "./AdminUserForm": { __esModule: true, default: stub },
    "./ChangePasswordDialog": { __esModule: true, default: PasswordDialog },
    "@/lib/apis": { __esModule: true, default: { admin: { Adminusers: { changePassword } } } },
    "@/hooks/useAuth": { useAuth: () => ({ user: { id: signedInId }, logout: async () => { loggedOut++; } }) },
  });
  function render() { hook.reset(); tree = Component(); }
  const dialog = () => find(tree, (el) => el.type === PasswordDialog);
  render();
  return {
    render, dialog, notifications, loggedOut: () => loggedOut,
    open: (user) => { find(tree, (el) => el.type === Table).props.onChangePassword(user); render(); },
  };
}

test("successful password update uses the selected admin, closes the dialog and shows backend success", async () => {
  let selectedId, payload;
  const h = adminHarness(async (id, data) => { selectedId = id; payload = data; return { message: "Password updated" }; });
  h.open({ id: 9, full_name: "Example Admin" });
  assert.match(h.dialog().key, /\$9$/);
  await h.dialog().props.onUpdate({ password: "valid-password", password_confirmation: "valid-password", email: "ignored@example.test" });
  h.render(); assert.equal(h.dialog(), null);
  assert.equal(selectedId, 9);
  assert.deepEqual(Object.keys(payload).sort(), ["password", "password_confirmation"]);
  assert.deepEqual(h.notifications, [["success", "Password updated"]]);
  assert.equal(h.loggedOut(), 0);
});

test("failed password update retains the dialog and propagates backend errors to the form", async () => {
  const error = { message: "Validation failed", errors: { password: ["Invalid"] } };
  const h = adminHarness(async () => { throw error; });
  h.open({ id: 9 });
  await assert.rejects(h.dialog().props.onUpdate({ password: "valid-password", password_confirmation: "valid-password" }), (failure) => failure === error);
  h.render(); assert.ok(h.dialog());
  assert.deepEqual(h.notifications, [["error", "Validation failed"]]);
});

test("updating your own password signs out after the backend revokes your tokens", async () => {
  const h = adminHarness(async () => ({ message: "Updated" }), 9);
  h.open({ id: 9 });
  await h.dialog().props.onUpdate({ password: "valid-password", password_confirmation: "valid-password" });
  h.render(); assert.equal(h.dialog(), null); assert.equal(h.loggedOut(), 1);
});
