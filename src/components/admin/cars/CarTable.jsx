import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { Link } from "@/i18n/navigation";
import { MoreDotIcon, PencilIcon, PlusIcon, TrashBinIcon } from "@/icons";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/admin/ui/table";
import { ImagePreview } from "@/components/admin/common/ImageUpload";

const cellClasses = "whitespace-nowrap px-5 py-3 text-start text-sm text-[#53699b] dark:text-gray-400";
const rateLabels = { per_km: "per km", per_day: "per day", per_trip: "per trip" };
const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2, minimumFractionDigits: 0 });

export default function CarTable({ cars, total, isLoading, busy, error, onDelete }) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <h2 id="cars-table-title" className="text-xl font-semibold md:text-2xl">Cars</h2>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-[#004bff] dark:bg-blue-500/15 dark:text-blue-400">{total ?? "—"} {total === 1 ? "car" : "cars"}</span>
        </div>
        <Link href="/admin/cars/create" className="inline-flex h-11 items-center justify-center gap-2.5 rounded-md bg-[#004bff] px-4 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
          <PlusIcon aria-hidden="true" className="block size-5 shrink-0" viewBox="0 0 20 20" />
          Add Car
        </Link>
      </div>
      <div className="overflow-x-auto">
        <Table className="w-full">
          <caption className="sr-only">Rental vehicles, categories, pricing, and visibility</caption>
          <TableHeader className="border-y border-[#e6ebf5] bg-[#f3f6fb] dark:border-gray-800 dark:bg-gray-800/50">
            <TableRow>
              {["Car", "Category", "Passenger seats", "Starting rate", "Status", "Actions"].map((label) => (
                <TableCell
                  key={label}
                  isHeader
                  className="whitespace-nowrap px-5 py-3 text-start text-xs font-medium uppercase text-[#53699b] dark:text-gray-400"
                >{label}</TableCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-[#e6ebf5] dark:divide-gray-800">
            {!isLoading && cars.map((car) => (
              <TableRow key={car.id} className="transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/30">
                <TableCell className={cellClasses}>
                  <div className="flex min-w-56 items-center gap-4">
                    <ImagePreview src={car.image_url} alt={car.title} className="h-12 w-20 shrink-0 rounded-lg object-contain" />
                    <span className="font-medium text-[#0b164d] dark:text-gray-100">{car.title}</span>
                  </div>
                </TableCell>
                <TableCell className={cellClasses}>{car.car_category?.title ?? "—"}</TableCell>
                <TableCell className={cellClasses}>{car.passenger_seats}</TableCell>
                <TableCell className={`${cellClasses} font-medium`}>
                  <span className="text-[#0b164d] dark:text-gray-100">{currency.format(Number(car.starting_rate))} {rateLabels[car.rate_basis]}</span>
                </TableCell>
                <TableCell className={cellClasses}>
                  <span className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 ${car.status ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" : "bg-slate-100 text-[#53699b] dark:bg-gray-800 dark:text-gray-300"}`}>
                    <span aria-hidden="true" className="size-2 rounded-full bg-current" />
                    {car.status ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell className={cellClasses}>
                  <Menu>
                    <MenuButton
                      disabled={busy}
                      aria-label={`Actions for ${car.title}`}
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
                        <Link href={`/admin/cars/${encodeURIComponent(car.id)}/edit`} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[#0b164d] data-focus:bg-blue-50 dark:text-gray-200 dark:data-focus:bg-gray-800">
                          <PencilIcon aria-hidden="true" className="size-5" />Edit
                        </Link>
                      </MenuItem>
                      <MenuItem>
                        <button
                          type="button"
                          onClick={() => onDelete(car)}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 data-focus:bg-red-50 dark:text-red-400 dark:data-focus:bg-gray-800"
                        >
                          <TrashBinIcon aria-hidden="true" className="size-5" />Delete
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
      {isLoading ? <p role="status" className="px-6 py-16 text-center font-medium">Loading cars...</p> : !error && cars.length === 0 && (
        <div role="status" className="px-6 py-16 text-center">
          <p className="font-medium">No cars found</p>
          <p className="mt-2 text-sm text-[#53699b] dark:text-gray-400">Try another search or reset your filters.</p>
        </div>
      )}
    </>
  );
}
