import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { Link } from "@/i18n/navigation";
import {
  EyeIcon,
  MoreDotIcon,
  PencilIcon,
  PlusIcon,
  TrashBinIcon,
} from "@/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";
import { ImagePreview } from "@/components/admin/common/ImageUpload";
import { primaryClasses } from "./PackageUI";

const cellClasses =
  "px-5 py-3 text-start text-sm text-[#53699b] dark:text-gray-400";
const menuClasses =
  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-[#0b164d] data-focus:bg-blue-50 dark:text-gray-200 dark:data-focus:bg-gray-800";

export default function PackageTable({
  packages,
  total,
  loading,
  busy,
  error,
  onDelete,
}) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <h2
            id="packages-table-title"
            className="text-xl font-semibold md:text-2xl"
          >
            Packages
          </h2>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-[#004bff] dark:bg-blue-500/15 dark:text-blue-400">
            {total ?? "—"} packages
          </span>
        </div>
        <Link href="/admin/packages/create" className={primaryClasses}>
          <PlusIcon aria-hidden="true" className="size-5" />
          Add Package
        </Link>
      </div>
      <div className="overflow-x-auto">
        <Table className="w-full">
          <caption className="sr-only">Travel packages</caption>
          <TableHeader className="border-y border-[#e6ebf5] bg-[#f3f6fb] dark:border-gray-800 dark:bg-gray-800/50">
            <TableRow>
              {[
                "Image",
                "Cities Covered",
                "Title",
                "Duration",
                "Status",
                "Actions",
              ].map((title) => (
                <TableCell
                  key={title}
                  isHeader
                  className="whitespace-nowrap px-5 py-3 text-start text-xs font-medium uppercase text-[#53699b] dark:text-gray-400"
                >
                  {title}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-[#e6ebf5] dark:divide-gray-800">
            {!loading &&
              packages.map((item) => (
                <TableRow
                  key={item.id}
                  className="transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/30"
                >
                  <TableCell className={cellClasses}>
                    <ImagePreview
                      src={item.cover_image_url}
                      alt={item.title}
                      className="h-14 w-24 shrink-0 rounded-md object-cover"
                    />
                  </TableCell>
                  <TableCell
                    className={`${cellClasses} min-w-40 text-[#0b164d] dark:text-gray-100`}
                  >
                    {item.cities_covered.map((city, index) => (
                      <span key={`${index}-${city}`}>
                        {index > 0 && " · "}
                        {city}
                      </span>
                    ))}
                  </TableCell>
                  <TableCell
                    className={`${cellClasses} min-w-48 font-medium text-[#0b164d] dark:text-gray-100`}
                  >
                    {item.title}
                  </TableCell>
                  <TableCell className={`${cellClasses} whitespace-nowrap`}>
                    {item.duration}
                  </TableCell>
                  <TableCell className={cellClasses}>
                    <span
                      className={`inline-flex rounded-full px-3.5 py-1 text-sm ${item.status ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" : "bg-slate-100 text-[#53699b] dark:bg-gray-800 dark:text-gray-300"}`}
                    >
                      {item.status ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className={cellClasses}>
                    <Menu>
                      <MenuButton
                        disabled={busy}
                        aria-label={`Actions for ${item.title}`}
                        className="flex size-10 items-center justify-center rounded-md border border-[#dce3f1] text-[#0b164d] hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        <MoreDotIcon aria-hidden="true" className="size-6" />
                      </MenuButton>
                      <MenuItems
                        anchor="bottom end"
                        portal
                        className="z-99999 w-44 rounded-lg border border-[#dce3f1] bg-white p-1 shadow-lg [--anchor-gap:4px] focus:outline-none dark:border-gray-700 dark:bg-gray-900"
                      >
                        <MenuItem>
                          <Link
                            href={`/admin/packages/${encodeURIComponent(item.id)}/edit`}
                            className={menuClasses}
                          >
                            <PencilIcon aria-hidden="true" className="size-5" />
                            Edit
                          </Link>
                        </MenuItem>
                        <MenuItem>
                          <button
                            type="button"
                            onClick={() => onDelete(item)}
                            className={`${menuClasses} text-red-600 data-focus:bg-red-50 dark:text-red-400`}
                          >
                            <TrashBinIcon
                              aria-hidden="true"
                              className="size-5"
                            />
                            Delete
                          </button>
                        </MenuItem>
                        <MenuItem>
                          <Link
                            href={`/admin/packages/${encodeURIComponent(item.id)}`}
                            className={menuClasses}
                          >
                            <EyeIcon aria-hidden="true" className="size-5" />
                            View details
                          </Link>
                        </MenuItem>
                      </MenuItems>
                    </Menu>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
      {loading ? (
        <p role="status" className="px-6 py-16 text-center font-medium">
          Loading packages...
        </p>
      ) : (
        !error &&
        packages.length === 0 && (
          <div role="status" className="px-6 py-16 text-center">
            <p className="font-medium">No packages found</p>
            <p className="mt-2 text-sm text-[#53699b] dark:text-gray-400">
              Try another search or reset your filters.
            </p>
          </div>
        )
      )}
    </>
  );
}
