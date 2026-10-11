# Categories API integration

Category CRUD uses `APIs.admin.categories`, exported from `src/lib/apis/admin/categories.js`, through the shared authenticated Axios instance. No API configuration flag or contract object is required.

- List: `GET /admin/categories` with `page`, `per_page`, optional `keyword`, and optional `status` (`1` or `0`). Responses provide `data` and backend `pagination` metadata.
- Read: `GET /admin/categories/{id}`.
- Create: `POST /admin/categories` with form data.
- Update: `POST /admin/categories/{id}` with form data and `_method=PUT`, so Laravel parses uploaded files before routing the update. JSON updates use `PUT /admin/categories/{id}`.
- Delete: `DELETE /admin/categories/{id}`, after confirmation.

The API module returns backend response data and propagates backend error payloads. The UI displays success/error toasts and maps validation errors to individual fields without clearing submitted values.

## Form and resource fields

Validation is declared alongside each explicit field in `CategoryForm.jsx`, based on the backend's `StoreCategoryRequest` and `UpdateCategoryRequest`:

- Title and slug are required, with a maximum of 255 characters. Slugs contain lowercase letters, numbers, and single hyphens between words. Slug uniqueness is enforced by the backend.
- Meta title is optional, with a maximum of 255 characters. Meta keywords and meta description are optional, with a maximum of 65,535 characters each. Description is optional.
- Status defaults to active. Form and filter values are `1` (active) and `0` (inactive); resource status is boolean.
- Image is optional: JPG/JPEG, PNG, or WebP, up to 2 MB. The frontend checks MIME type, extension and size; the backend also validates image contents.
- Resources provide `image` as a stored path and `image_url` as the browser-accessible URL. Previews and table thumbnails use `image_url`.

Uploads use local object-URL previews released on replacement/unmount. Discarding a selected replacement restores the stored image. Unchanged images are omitted from writes. Existing-image removal is not supported by the backend update handler, so the form has no removal action or payload. IDs are used in routes and are not sent as writable fields.

## Frontend routes

- `/admin/categories`: filtered list, total count, rows per page, pagination, and Edit/Delete actions. Deletion refreshes the backend list.
- `/admin/categories/create`: shared form with explicit fields, returning to the list after successful creation.
- `/admin/categories/[id]/edit`: loads the backend record before mounting the same form, preserving its slug and image.

Requests retain loading states, stale-response cleanup, duplicate-submission guards, and backend error handling. Toasts are provided by the shared admin layout through `AdminToaster` across all admin routes.
