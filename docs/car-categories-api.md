# Admin car categories

The section uses `APIs.admin.carRental` and the existing shared Axios instance.
The contract was checked against `CarCategoryController`, `CarCategoryResource`,
`StoreCarCategoryRequest`, and `UpdateCarCategoryRequest` in the backend.

## Pages

- `/admin/car-categories`: filtered, paginated category list and delete confirmation.
- `/admin/car-categories/create`: create a category.
- `/admin/car-categories/[id]/edit`: fetch and edit a category.

Successful saves return to the list, which fetches fresh backend data on page 1.
Successful deletions refresh the current list and move back a page if necessary.

## Requests

| API method | Backend request | Usage |
| --- | --- | --- |
| `getCategories` | `GET /admin/car-categories` | `keyword`, `status` (`1` or `0`), `page`, `per_page` |
| `getCategory` | `GET /admin/car-categories/{id}` | Edit defaults |
| `createCategory` | `POST /admin/car-categories` | Multipart category fields and optional image |
| `updateCategory` | `POST /admin/car-categories/{id}` with `_method=PUT` | Existing API module handles Laravel's multipart method override |
| `deleteCategory` | `DELETE /admin/car-categories/{id}` | Backend rejects categories containing cars with HTTP 409 |
| `getCars` | `GET /admin/cars` | Filter by `car_category_id` for counts and the View Cars dialog |

Lists consume `data` and `pagination` (`current_page`, `last_page`, `per_page`,
`total`, `from`, `to`). Category records use the backend's `image_url` for previews.

## Form fields

Each input and its validation are declared individually in `CarCategoryForm.jsx`.

- `title`: required, at most 255 characters.
- `slug`: required, at most 255 characters; lowercase letters, digits, and single
  hyphens between words. Generated from the title until manually edited; preserved
  when editing an existing record. Uniqueness is checked by the backend.
- `description`: optional text.
- `meta_title`: optional, at most 255 characters.
- `meta_keyword`, `meta_description`: optional, at most 65,535 characters each.
- `status`: `1` or `0`; defaults to active on creation.
- `image`: optional single PNG, JPEG, or WebP file, up to 2 MB. Both MIME type and
  extension are validated. Editing omits this field unless a replacement is chosen.

Backend field errors stay inline, general/unmapped errors appear above the form,
and notifications use the shared admin Toaster. Failed saves retain entered values.

## Car counts and preview

The category resource does not expose `cars_count`. Each visible row therefore
requests `getCars({ car_category_id, per_page: 1, page: 1 })` and displays the
backend's pagination total, including inactive cars. This adds one request per
visible category. Count failures show "Count unavailable" instead of a false zero.

View Cars opens an accessible, paginated, read-only dialog using the same filter.
It does not depend on the future Cars management page. All list, count, and edit
fetches ignore responses after cleanup.
