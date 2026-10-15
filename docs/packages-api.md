# Package manager integration

The admin package pages use `APIs.admin.packages` and the shared authenticated Axios instance. Contracts were checked against the backend `PackageController`, `PackageResource`, and five `SavePackage*Request` classes.

## Routes

- `/admin/packages`: listing, backend keyword/status filters, `page` and `per_page` pagination.
- `/admin/packages/create`: save Basic Details to create a draft, then replace the URL with `/admin/packages/{id}/edit`.
- `/admin/packages/{id}/edit`: fetch the package and open its next unfinished step; completed packages start at Basic Details.
- `/admin/packages/{id}`: read-only details.

## Saves

| Step                      | API method                        | Payload                                                                                                                                         |
| ------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Basic Details             | `createPackage` / `updatePackage` | `title`, `slug`, `duration`, `tour_best_time`, `is_special_package`, `status`, `meta_title`, `meta_keyword`, `meta_description`                 |
| Categories & Destinations | `saveRelations`                   | `category_ids`, `destination_ids`                                                                                                               |
| Itineraries               | `saveItineraries`                 | `itineraries[]` with retained `id`, `title`, `description`, optional replacement `image`, and one-based `sort_order`; `deleted_itinerary_ids[]` |
| Package Details           | `saveDetails`                     | `inclusion`, `exclusion`, `accommodation_details`, `transportation`, `description`                                                              |
| Photos                    | `savePhotos`                      | `photos[]` with retained `id` or new `image`, one-based `sort_order`; `deleted_image_ids[]`                                                     |

Itineraries use multipart form data. Photos use multipart only when new files are present; existing-photo reordering and deletion use JSON. The API module applies multipart POST/PATCH method overriding. Existing images are never downloaded and uploaded again to reorder them.

Each successful save returns `{ status, data, message }`, with the full package resource in `data`. `current_step` identifies the next unfinished step (1–5), while 6 means complete. The backend preserves progress when earlier steps are saved. `completed_steps` and `is_complete` control direct step access.

Backend-required fields are title, slug, duration, at least one category and destination, itinerary titles/descriptions, package description, and at least one remaining photo. SEO and best time to visit are optional. Both kinds of images accept JPEG, PNG, and WebP, with a 2 MB limit per image; dynamic collections are limited to 100 items.

The resource supplies `cover_image_url`, the `cities_covered` title array, boolean `status`, `category_ids`, `destination_ids`, ordered `itineraries`, and ordered `images`. The UI uses these fields directly. Options are fetched across every category/destination pagination page.

All step forms stay mounted during step navigation so local values survive Back and direct navigation. Successful saves remount only the saved step with the returned data. Switching away from a dirty step asks for confirmation; cancelling the editor warns before discarding local changes.

## Verification

`node --test tests/packages.test.mjs` covers method selection, multipart handling, validation, backend errors, duplicate submissions, option pagination, ordered upload/deletion payloads, resume/progress, completed-step access, listing filters/pagination, and last-row deletion. Existing Categories, Destinations, Admin User, and Change Password tests provide regression coverage.

No backend response or payload contracts are missing. Browser visual verification requires an available browser session. The repository-wide production build currently compiles successfully but fails TypeScript checks in unrelated legacy components with missing imports/dependencies.
