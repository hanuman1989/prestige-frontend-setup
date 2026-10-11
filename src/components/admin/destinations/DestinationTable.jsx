import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { Link } from "@/i18n/navigation";
import { EyeIcon, MoreDotIcon, PencilIcon, PlusIcon, TrashBinIcon } from "@/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";
import { ImagePreview } from "@/components/admin/common/ImageUpload";

const cellClasses =
  "px-6 py-3 text-start text-sm text-[#53699b] dark:text-gray-400";

export default function DestinationTable({
  destinations,
  total,
  isLoading,
  onDelete,
  busy,
  error,
}) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <h2
            id="destinations-table-title"
            className="text-xl font-semibold md:text-2xl"
          >
            Destinations
          </h2>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-[#004bff] dark:bg-blue-500/15 dark:text-blue-400">
            {total ?? "—"} {total === 1 ? "destination" : "destinations"}
          </span>
        </div>
        <Link
          href="/admin/destinations/create"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2.5 whitespace-nowrap rounded-md bg-[#004bff] px-4 text-sm font-medium leading-none text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <PlusIcon aria-hidden="true" className="block size-5 shrink-0" />
          <span>Add Destination</span>
        </Link>
      </div>
      <div className="overflow-x-auto">
        <Table className="w-full">
          <caption className="sr-only">
            Domestic and international destinations
          </caption>
          <TableHeader className="border-y border-[#e6ebf5] bg-[#f3f6fb] dark:border-gray-800 dark:bg-gray-800/50">
            <TableRow>
              {["Destination", "Slug", "Type", "Most Popular", "Status", "Actions"].map(
                (label) => (
                  <TableCell
                    key={label}
                    isHeader
                    className="whitespace-nowrap px-6 py-3 text-start text-xs font-medium uppercase text-[#53699b] dark:text-gray-400"
                  >
                    {label}
                  </TableCell>
                ),
              )}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-[#e6ebf5] dark:divide-gray-800">
            {!isLoading &&
              destinations.map((destination) => (
                <TableRow
                  key={destination.id}
                  className="transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/30"
                >
                  <TableCell className={cellClasses}>
                    <div className="flex min-w-52 items-center gap-4">
                      <ImagePreview
                        src={destination.image_url}
                        alt={destination.title}
                        className="h-12 w-20 shrink-0 rounded-lg object-cover"
                      />
                      <span className="font-medium text-[#0b164d] dark:text-gray-100">
                        {destination.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className={`${cellClasses} whitespace-nowrap`}>
                    {destination.slug}
                  </TableCell>
                  <TableCell className={cellClasses}>
                    <span className={`inline-flex whitespace-nowrap rounded-full px-3.5 py-1 text-sm ${destination.destination_type === 1 ? "bg-blue-50 text-[#004bff] dark:bg-blue-500/15 dark:text-blue-400" : "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400"}`}>
                      {destination.destination_type === 1 ? "Domestic" : "International"}
                    </span>
                  </TableCell>
                  <TableCell className={cellClasses}>
                    <span className={`inline-flex min-w-20 justify-center rounded-full px-3.5 py-1 text-sm ${destination.is_most_popular ? "bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400" : "bg-slate-100 text-[#53699b] dark:bg-gray-800 dark:text-gray-300"}`}>
                      {destination.is_most_popular ? "Yes" : "No"}
                    </span>
                  </TableCell>
                  <TableCell className={cellClasses}>
                    <span
                      className={`inline-flex rounded-full px-3.5 py-1 text-sm ${destination.status ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" : "bg-slate-100 text-[#53699b] dark:bg-gray-800 dark:text-gray-300"}`}
                    >
                      {destination.status ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className={cellClasses}>
                    <Menu>
                      <MenuButton
                        disabled={busy}
                        aria-label={`Actions for ${destination.title}`}
                        className="flex size-9 items-center justify-center rounded-md border border-[#dce3f1] text-[#0b164d] hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        <MoreDotIcon aria-hidden="true" className="size-6" />
                      </MenuButton>
                      <MenuItems
                        anchor="bottom end"
                        portal
                        className="z-99999 w-40 rounded-lg border border-[#dce3f1] bg-white p-1 shadow-lg [--anchor-gap:4px] focus:outline-none dark:border-gray-700 dark:bg-gray-900"
                      >
                        <MenuItem>
                          <Link
                            href={`/admin/destinations/${encodeURIComponent(destination.id)}`}
                            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[#0b164d] data-focus:bg-blue-50 dark:text-gray-200 dark:data-focus:bg-gray-800"
                          >
                            <EyeIcon aria-hidden="true" className="size-5" />
                            View details
                          </Link>
                        </MenuItem>
                        <MenuItem>
                          <Link
                            href={`/admin/destinations/${encodeURIComponent(destination.id)}/edit`}
                            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[#0b164d] data-focus:bg-blue-50 dark:text-gray-200 dark:data-focus:bg-gray-800"
                          >
                            <PencilIcon aria-hidden="true" className="size-5" />
                            Edit
                          </Link>
                        </MenuItem>
                        <MenuItem>
                          <button
                            type="button"
                            onClick={() => onDelete(destination)}
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 data-focus:bg-red-50 dark:text-red-400 dark:data-focus:bg-gray-800"
                          >
                            <TrashBinIcon
                              aria-hidden="true"
                              className="size-5"
                            />
                            Delete
                          </button>
                        </MenuItem>
                      </MenuItems>
                    </Menu>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
      {isLoading ? (
        <div role="status" className="px-6 py-16 text-center font-medium">
          Loading destinations...
        </div>
      ) : (
        !error && destinations.length === 0 && (
          <div role="status" className="px-6 py-16 text-center">
            <p className="font-medium">No destinations found</p>
            <p className="mt-2 text-sm text-[#53699b] dark:text-gray-400">
              Try another search or reset your filters.
            </p>
          </div>
        )
      )}
    </>
  );
}
