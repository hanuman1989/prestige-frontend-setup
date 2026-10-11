export const ADMIN_USER_FIELDS = [
  "first_name", "last_name", "mobile", "email", "password", "password_confirmation", "status",
];

const trimValue = (value) => value.trim();

export function getAdminUserRules(isEditing = false) {
  return {
    first_name: {
      required: "Enter the first name.",
      maxLength: { value: 255, message: "First name cannot exceed 255 characters." },
      setValueAs: trimValue,
    },
    last_name: {
      required: "Enter the last name.",
      maxLength: { value: 255, message: "Last name cannot exceed 255 characters." },
      setValueAs: trimValue,
    },
    mobile: {
      maxLength: { value: 30, message: "Mobile cannot exceed 30 characters." },
      validate: (value) =>
        !value ||
        (/^\+?[\d\s().-]+$/.test(value) && /\d/.test(value)) ||
        "Enter a mobile number using digits and optional +, spaces, parentheses or hyphens.",
      setValueAs: trimValue,
    },
    email: {
      disabled: isEditing,
      required: "Enter the email address.",
      maxLength: { value: 255, message: "Email cannot exceed 255 characters." },
      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email address." },
      setValueAs: trimValue,
    },
    ...(!isEditing && {
      password: {
        required: "Enter a password.",
        minLength: { value: 8, message: "Password must contain at least 8 characters." },
        maxLength: { value: 255, message: "Password cannot exceed 255 characters." },
        validate: (value) => !value || Boolean(value.trim()) || "Password cannot contain only spaces.",
        deps: ["password_confirmation"],
      },
      password_confirmation: {
        required: "Confirm the password.",
        maxLength: { value: 255, message: "Password confirmation cannot exceed 255 characters." },
        validate: (value, values) => value === values.password || "Passwords do not match.",
      },
    }),
    status: {
      required: "Select a status.",
      validate: (value) => ["1", "0"].includes(value) || "Select Active or Inactive.",
    },
  };
}

export function getAdminUserDefaults(user) {
  return {
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
    mobile: user?.mobile ?? "",
    email: user?.email ?? "",
    password: "",
    password_confirmation: "",
    status: user?.status === "inactive" || user?.status === false ? "0" : "1",
  };
}

export function buildAdminUserPayload(values, isEditing = false) {
  const payload = {
    first_name: values.first_name.trim(),
    last_name: values.last_name.trim(),
    mobile: values.mobile.trim() || null,
    status: values.status === "1",
  };

  if (!isEditing) {
    payload.email = values.email.trim();
    payload.password = values.password;
    payload.password_confirmation = values.password_confirmation;
  }

  return payload;
}

export function applyAdminUserErrors(error, setError, isEditing = false) {
  const otherMessages = [];
  let firstField = null;

  Object.entries(error?.errors ?? {}).forEach(([field, messages]) => {
    const message = Array.isArray(messages) ? messages.join(" ") : String(messages);
    const isEditable = !isEditing || !["email", "password", "password_confirmation"].includes(field);

    if (ADMIN_USER_FIELDS.includes(field) && isEditable) {
      firstField ??= field;
      setError(field, { type: "server", message });
    } else {
      otherMessages.push(message);
    }
  });

  setError("root.server", {
    type: "server",
    message: [error?.message || "Unable to save the admin user. Please try again.", ...otherMessages].join(" "),
  });
  return firstField;
}
