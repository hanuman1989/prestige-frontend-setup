import { useEffect, useState } from "react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, Description } from "@headlessui/react";
import toast from "react-hot-toast";
import APIs from "@/lib/apis";
import { CloseIcon } from "@/icons";
import { ImagePreview } from "@/components/admin/common/ImageUpload";
import Pagination from "@/components/admin/tables/Pagination";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/admin/ui/table";

export default function CarCategoryCarsDialog({ category, onClose }) {
  const [cars, setCars] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryVersion, setRetryVersion] = useState(0);

  useEffect(() => {
    let isActive = true;
    let changingPage = false;
    async function loadCars() {
      try {
        const response = await APIs.admin.carRental.getCars({
          car_category_id: category.id,
          per_page: 10,
          page,
        });
        if (!isActive) return;
        if (page > response.pagination.last_page) {
          changingPage = true;
          setPage(Math.max(1, response.pagination.last_page));
          return;
        }
        setCars(response.data);
        setPagination(response.pagination);
        setError("");
      } catch (failure) {
        if (!isActive) return;
        const message = failure.message || "Unable to load cars. Please try again.";
        setError(message);
        setCars([]);
        setPagination(null);
        toast.error(message, { position: "bottom-center" });
      } finally {
        if (isActive && !changingPage) setIsLoading(false);
      }
    }
    void loadCars();
    return () => { isActive = false; };
  }, [category.id, page, retryVersion]);

  function changePage(nextPage) {
    if (isLoading || nextPage === page) return;
    setIsLoading(true);
    setPage(nextPage);
  }

  return (
    <Dialog open onClose={onClose} className="relative z-99999">
      <DialogBackdrop className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
        <DialogPanel className="relative my-auto w-full max-w-2xl rounded-2xl bg-white p-6 text-[#0b164d] shadow-xl dark:bg-gray-900 dark:text-gray-100">
          <button type="button" onClick={onClose} aria-label="Close cars" className="absolute end-5 top-5 flex size-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 focus-visible:outline-2 focus-visible:outline-blue-600 dark:bg-gray-800 dark:text-gray-300">
            <CloseIcon aria-hidden="true" className="block size-6 shrink-0" viewBox="0 0 24 24" />
          </button>
          <DialogTitle className="pe-10 text-2xl font-semibold">{category.title} cars</DialogTitle>
          <Description className="mt-2 text-sm text-[#53699b] dark:text-gray-400">Rental vehicles assigned to this category.</Description>
          <div aria-busy={isLoading} className="mt-6 overflow-hidden rounded-xl border border-[#dce3f1] dark:border-gray-800">
            {isLoading ? (
              <p role="status" className="p-8 text-center text-sm">Loading cars...</p>
            ) : error ? (
              <div role="alert" className="p-6 text-center text-sm text-red-600 dark:text-red-400">
                <p>{error}</p>
                <button type="button" onClick={() => { setIsLoading(true); setRetryVersion((value) => value + 1); }} className="mt-3 rounded-md border border-current px-3 py-2 focus-visible:outline-2">Try again</button>
              </div>
            ) : cars.length === 0 ? (
              <p role="status" className="p-8 text-center text-sm">No cars in this category yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table className="w-full text-sm">
                  <caption className="sr-only">Cars in {category.title}</caption>
                  <TableHeader className="bg-[#f3f6fb] text-start text-xs uppercase text-[#53699b] dark:bg-gray-800 dark:text-gray-400">
                    <TableRow>
                      <TableCell isHeader className="px-4 py-3 text-start">Car</TableCell>
                      <TableCell isHeader className="px-4 py-3 text-start">Seats</TableCell>
                      <TableCell isHeader className="px-4 py-3 text-start">Status</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-[#e6ebf5] dark:divide-gray-800">
                    {cars.map((car) => (
                      <TableRow key={car.id}>
                        <TableCell className="px-4 py-3">
                          <div className="flex min-w-48 items-center gap-3">
                            <ImagePreview src={car.image_url} alt={car.title} className="h-12 w-20 shrink-0 rounded-md object-cover" />
                            <span className="font-medium">{car.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">{car.passenger_seats}</TableCell>
                        <TableCell className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-3 py-1 ${car.status ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" : "bg-slate-100 text-[#53699b] dark:bg-gray-800 dark:text-gray-300"}`}>{car.status ? "Active" : "Inactive"}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          {pagination && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[#53699b] dark:text-gray-400">{pagination.total} {pagination.total === 1 ? "car" : "cars"}</p>
              <fieldset disabled={isLoading} aria-label="Cars pagination" className="disabled:opacity-60">
                <Pagination currentPage={pagination.current_page} totalPages={Math.max(1, pagination.last_page)} onPageChange={changePage} />
              </fieldset>
            </div>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
