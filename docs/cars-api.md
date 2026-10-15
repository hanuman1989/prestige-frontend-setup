# Admin cars

The Cars section uses the existing `APIs.admin.carRental` methods and shared Axios
authentication. No API endpoints or exports were changed. The contract was checked
against `CarController`, `CarResource`, `StoreCarRequest`, and `UpdateCarRequest`.

## Pages and requests

| Page | Purpose |
| --- | --- |
| `/admin/cars` | List, filter, paginate, and delete vehicles |
| `/admin/cars/create` | Create a vehicle |
| `/admin/cars/[id]/edit` | Load and edit a vehicle |

`getCars` receives `keyword`, `car_category_id`, `status` (`1` or `0`), `page`, and
`per_page`. The list defaults to six rows per page and uses the backend's pagination
metadata. Filters and row-count changes reset to page 1; successful deletions refresh
the list and move back a page when its final row is removed.

`getCar`, `createCar`, `updateCar`, and `deleteCar` target the existing `/admin/cars`
resource. Saves use `FormData`; the API module handles Laravel's POST `_method=PUT`
override for edits. Success returns to a newly fetched list on page 1. Images use
the backend's `image_url`.

## Validation and payloads

Every field and its validation is explicitly declared in `CarForm.jsx`.

- Title and slug are required, up to 255 characters. Slugs use lowercase letters,
  numbers, and single hyphens between words. Generated slugs follow the title until
  customized; saved slugs are preserved on edit. Backend uniqueness errors are inline.
- Category is required. Both the filter and form load all category pages, including
  inactive categories. Saving waits for the options to load and requires a category.
- Brand and model are optional, up to 100 and 150 characters respectively.
- Passenger seats are required integers from 1 to 65,535. Luggage bags and minimum
  kilometres per day are non-negative integers, up to 65,535. Blank luggage becomes
  zero; blank minimum kilometres clears the nullable value.
- Transmission is `manual` or `automatic`; rate basis is `per_km`, `per_day`, or
  `per_trip`. The list formats rates as INR with the corresponding unit.
- Starting rate is required. Starting rate, driver allowance, and extra-kilometre
  rate allow up to two decimal places, from zero to 99,999,999.99. The backend makes
  driver allowance and extra-kilometre rate optional. Blanks clear nullable pricing
  on edit; zero remains zero.
- Air conditioning, featured, and status are submitted explicitly as `1` or `0`.
- Description, inclusion, exclusion, and cancellation policy are optional text.
- SEO title is optional, up to 255 characters. SEO keywords and description are
  optional, up to 65,535 characters each.
- An optional JPEG, PNG, or WebP image must have a matching supported extension and
  be at most 2 MB. Edit payloads omit image unless a replacement is selected.

Backend field errors remain inline, unmapped errors are visible above the form,
and the first failing input receives focus after submission completes. Values are
retained after failures. Pending submissions and deletes guard repeated requests
and cancel actions. Read requests ignore responses after cleanup.

## Checks

Run the focused tests with `node --test tests/cars.test.mjs`. They exercise form
validation, payloads, slug behavior, uploads, duplicate submissions, backend errors,
category pagination, filter parameters, and deletion refresh behavior.
