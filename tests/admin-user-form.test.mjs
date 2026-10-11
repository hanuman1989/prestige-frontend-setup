import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import { transformSync } from "@babel/core";
import { createFormControl } from "react-hook-form";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  applyAdminUserErrors,
  buildAdminUserPayload,
  getAdminUserDefaults,
  getAdminUserRules,
} from "../src/lib/validation/adminUser.js";

const require = createRequire(import.meta.url);
const validValues = {
  first_name: "Alice",
  last_name: "Johnson",
  mobile: "+91 98765 43210",
  email: "alice@example.com",
  password: "password1234",
  password_confirmation: "password1234",
  status: "1",
};

function makeForm(values = validValues, isEditing = false) {
  const form = createFormControl({ defaultValues: getAdminUserDefaults() });
  form.subscribe({ formState: { values: true, errors: true }, callback: () => {} });
  Object.entries(getAdminUserRules(isEditing)).forEach(([name, rules]) => {
    const field = form.register(name, rules);
    field.ref({ name, type: "text", value: values[name] ?? "" });
    form.setValue(name, values[name]);
  });
  return form;
}

function loadAPI(axios) {
  const filename = new URL("../src/lib/apis/admin/adminUsers.js", import.meta.url);
  const { code } = transformSync(readFileSync(filename, "utf8"), {
    babelrc: false,
    configFile: false,
    plugins: [require.resolve("@babel/plugin-transform-modules-commonjs")],
  });
  const testModule = { exports: {} };
  vm.runInNewContext(code, {
    exports: testModule.exports,
    module: testModule,
    require: (name) => {
      assert.equal(name, "@/lib/axios");
      return axios;
    },
  });
  return testModule.exports.default;
}

function renderForm(user) {
  const filename = new URL("../src/components/admin/adminUsers/AdminUserForm.jsx", import.meta.url);
  const { code } = transformSync(readFileSync(filename, "utf8"), {
    babelrc: false,
    configFile: false,
    plugins: [
      [require.resolve("@babel/plugin-transform-react-jsx"), { runtime: "automatic" }],
      require.resolve("@babel/plugin-transform-modules-commonjs"),
    ],
  });
  const testModule = { exports: {} };
  vm.runInNewContext(code, {
    exports: testModule.exports,
    module: testModule,
    require: (name) => {
      if (name === "@headlessui/react") {
        // Render dialog contents without Headless UI's browser portal.
        return Object.fromEntries(["Dialog", "DialogBackdrop", "DialogPanel", "DialogTitle", "Description"].map((component) => [
          component, ({ children }) => createElement("div", null, children),
        ]));
      }
      if (name === "@/icons") return { CloseIcon: () => createElement("svg") };
      if (name === "@/lib/validation/adminUser") {
        return { applyAdminUserErrors, buildAdminUserPayload, getAdminUserDefaults, getAdminUserRules };
      }
      return require(name);
    },
  });
  return renderToStaticMarkup(createElement(testModule.exports.default, { user, onClose: () => {}, onSave: async () => {} }));
}

test("edit renders disabled email and hides both password inputs", () => {
  const html = renderForm({ ...validValues, id: 9, status: true });
  const email = html.match(/<input\b[^>]*name="email"[^>]*>/)?.[0];
  assert.ok(email);
  assert.match(email, /disabled=""/);
  assert.doesNotMatch(html, /<input\b[^>]*type="password"/);
});

test("add renders enabled email and two required password inputs", () => {
  const html = renderForm();
  const email = html.match(/<input\b[^>]*name="email"[^>]*>/)?.[0];
  assert.ok(email);
  assert.doesNotMatch(email, /disabled=/);
  const passwords = html.match(/<input\b[^>]*type="password"[^>]*>/g);
  assert.equal(passwords.length, 2);
  passwords.forEach((input) => assert.match(input, /aria-required="true"/));
  assert.match(passwords[1], /name="password_confirmation"/);
});

test("valid create trims text and sends a confirmed password and boolean inactive status", async () => {
  const form = makeForm({ ...validValues, first_name: " Alice ", email: " alice@example.com ", mobile: " 0098765432 ", password: " password1234 ", password_confirmation: " password1234 ", status: "0" });
  let submitted;
  await form.handleSubmit((values) => { submitted = buildAdminUserPayload(values); })();

  assert.deepEqual(submitted, {
    first_name: "Alice", last_name: "Johnson", mobile: "0098765432", email: "alice@example.com",
    status: false, password: " password1234 ", password_confirmation: " password1234 ",
  });
});

const invalidCases = [
  ["blank first name", "first_name", "   "],
  ["blank last name", "last_name", ""],
  ["long first name", "first_name", "a".repeat(256)],
  ["long last name", "last_name", "a".repeat(256)],
  ["missing email", "email", ""],
  ["invalid email", "email", "not-an-email"],
  ["long email", "email", `${"a".repeat(245)}@example.com`],
  ["invalid mobile", "mobile", "not-a-number"],
  ["mobile without digits", "mobile", "---"],
  ["long mobile", "mobile", "1".repeat(31)],
  ["missing password", "password", ""],
  ["short create password", "password", "1234567"],
  ["long password", "password", "p".repeat(256)],
  ["whitespace password", "password", "        "],
  ["missing password confirmation", "password_confirmation", ""],
  ["mismatched password confirmation", "password_confirmation", "different1234"],
  ["long password confirmation", "password_confirmation", "p".repeat(256)],
  ["invalid status", "status", "active"],
];
for (const [label, field, value] of invalidCases) {
  test(`invalid input blocks submission: ${label}`, async () => {
    const form = makeForm({ ...validValues, [field]: value });
    let submitted = false;
    await form.handleSubmit(() => { submitted = true; })();

    assert.equal(submitted, false);
    assert.ok(form.getFieldState(field).error?.message);
  });
}

test("editing skips credential validation and excludes credentials while clearing optional mobile", async () => {
  const form = makeForm({ ...validValues, email: "", password: "", password_confirmation: "", mobile: "" }, true);
  let submitted;
  await form.handleSubmit((values) => {
    assert.equal(values.email, undefined);
    submitted = buildAdminUserPayload(values, true);
  })();

  assert.equal(submitted.mobile, null);
  assert.equal(submitted.status, true);
  assert.equal("email" in submitted, false);
  assert.equal("password" in submitted, false);
  assert.equal("password_confirmation" in submitted, false);
});

test("create accepts a matching 8-character password and confirmation", async () => {
  const create = makeForm({ ...validValues, password: "12345678", password_confirmation: "12345678" });
  assert.equal(await create.trigger(), true);
});

test("confirmation is checked again against a changed password before submission", async () => {
  const form = makeForm();
  assert.equal(await form.trigger(), true);
  form.setValue("password", "changed1234");
  let submitted = false;
  await form.handleSubmit(() => { submitted = true; })();
  assert.equal(submitted, false);
  assert.equal(form.getFieldState("password_confirmation").error.message, "Passwords do not match.");
  form.setValue("password_confirmation", "changed1234");
  assert.equal(await form.trigger(), true);
});

test("update payload never includes credentials even when values contain them", () => {
  assert.deepEqual(buildAdminUserPayload(validValues, true), {
    first_name: "Alice", last_name: "Johnson", mobile: "+91 98765 43210", status: true,
  });
  assert.equal(getAdminUserRules(true).password, undefined);
  assert.equal(getAdminUserRules(true).password_confirmation, undefined);
  assert.equal(getAdminUserRules(true).email.disabled, true);
});

test("edit defaults retain names and inactive status without filling in a password", () => {
  const defaults = getAdminUserDefaults({ first_name: "Alice", last_name: "Johnson", email: "alice@example.com", mobile: null, status: false, password: "must-not-be-prefilled" });
  assert.deepEqual(defaults, { first_name: "Alice", last_name: "Johnson", email: "alice@example.com", mobile: "", password: "", password_confirmation: "", status: "0" });
  assert.equal(getAdminUserDefaults({ status: "inactive" }).status, "0");
});

test("create uses POST and update uses PUT with the validated API payload", async () => {
  const requests = [];
  const api = loadAPI({
    post: async (url, data) => { requests.push(["POST", url, data]); return { data: { status: true, data: { id: 9 } } }; },
    put: async (url, data) => { requests.push(["PUT", url, data]); return { data: { status: true, data: { id: 9 } } }; },
  });
  const payload = buildAdminUserPayload(validValues);
  await api.createUser(payload);
  await api.updateUser(9, buildAdminUserPayload(validValues, true));

  assert.equal(requests[0][0], "POST");
  assert.equal(requests[0][1], "/admin/admin-users");
  assert.equal(requests[0][2].password_confirmation, validValues.password);
  assert.equal(requests[1][0], "PUT");
  assert.equal(requests[1][1], "/admin/admin-users/9");
  assert.equal(requests[1][2].status, true);
  assert.equal("email" in requests[1][2], false);
  assert.equal("password" in requests[1][2], false);
  assert.equal("password_confirmation" in requests[1][2], false);
});

test("backend validation after a valid submission appears on the field and can be retried", async () => {
  let attempts = 0;
  const api = loadAPI({
    post: async () => {
      attempts += 1;
      if (attempts === 1) {
        throw { response: { status: 422, data: { message: "Validation failed.", errors: { email: ["The email has already been taken."] } } } };
      }
      return { data: { status: true, data: { id: 9 } } };
    },
  });
  const form = makeForm();
  let saved = false;
  const submit = async (values) => {
    try {
      await api.createUser(buildAdminUserPayload(values));
      saved = true;
    } catch (error) {
      applyAdminUserErrors(error, form.setError);
    }
  };
  await form.handleSubmit(submit)();
  assert.equal(saved, false);
  assert.equal(form.getFieldState("email").error.message, "The email has already been taken.");
  assert.equal(form.getFieldState("root.server").error.message, "Validation failed.");
  assert.equal(form.getValues("first_name"), "Alice");

  form.setValue("email", "available@example.com");
  await form.handleSubmit(submit)();
  assert.equal(saved, true);
  assert.equal(attempts, 2);
  assert.equal(form.getFieldState("email").error, undefined);
  assert.equal(form.getFieldState("root.server").error, undefined);
});

test("password confirmation errors appear on confirmation and unknown errors stay visible", () => {
  const form = makeForm();
  const first = applyAdminUserErrors({
    message: "Validation failed.",
    errors: { password_confirmation: ["Password confirmation does not match."], account: ["This account cannot be changed."] },
  }, form.setError);

  assert.equal(first, "password_confirmation");
  assert.equal(form.getFieldState("password_confirmation").error.message, "Password confirmation does not match.");
  assert.match(form.getFieldState("root.server").error.message, /This account cannot be changed/);
});

test("backend errors for disabled or hidden edit fields stay visible without focusing them", () => {
  const form = makeForm(validValues, true);
  const first = applyAdminUserErrors({
    message: "Validation failed.",
    errors: { email: ["Email cannot be changed."], password: ["Password cannot be changed."], password_confirmation: ["Confirmation is unavailable."] },
  }, form.setError, true);
  assert.equal(first, null);
  assert.match(form.getFieldState("root.server").error.message, /Email cannot be changed/);
  assert.match(form.getFieldState("root.server").error.message, /Password cannot be changed/);
  assert.match(form.getFieldState("root.server").error.message, /Confirmation is unavailable/);
});

test("network failures stay visible and do not report a successful save", async () => {
  const form = makeForm();
  const api = loadAPI({ post: async () => { throw new Error("Network failure"); } });
  let saved = false;
  await form.handleSubmit(async (values) => {
    try {
      await api.createUser(buildAdminUserPayload(values));
      saved = true;
    } catch (error) {
      applyAdminUserErrors(error, form.setError);
    }
  })();

  assert.equal(saved, false);
  assert.equal(form.getFieldState("root.server").error.message, "Failed to create user");
});

test("submission remains pending until the API request completes", async () => {
  const form = makeForm();
  const submittingStates = [];
  form.subscribe({ formState: { isSubmitting: true }, callback: (state) => submittingStates.push(state.isSubmitting) });
  let finishRequest;
  let requestStarted;
  const pendingRequest = new Promise((resolve) => { finishRequest = resolve; });
  const started = new Promise((resolve) => { requestStarted = resolve; });
  const api = loadAPI({ post: async () => { requestStarted(); await pendingRequest; return { data: { status: true } }; } });
  let saved = false;
  const submission = form.handleSubmit(async (values) => {
    await api.createUser(buildAdminUserPayload(values));
    saved = true;
  })();
  await started;

  assert.equal(saved, false);
  assert.equal(submittingStates.at(-1), true);
  finishRequest();
  await submission;
  assert.equal(saved, true);
  assert.equal(submittingStates.at(-1), false);
});
