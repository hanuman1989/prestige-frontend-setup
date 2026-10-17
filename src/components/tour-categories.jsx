"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import APIs from "@/lib/apis";
import { FiArrowRight } from "react-icons/fi";
import ImagePreview from "@/components/common/ImagePreview";

const imageLayout = [
  {
    layout: "lg:col-span-2 lg:row-span-2",
    featured: true,
  },
  {
    layout: "lg:col-span-2",
    imagePosition: "object-top",
  },
];

export default function Tourcategories() {
  const [tourCategories, setTourCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;
    async function loadCategories() {
      setIsLoading(true);
      try {
        const params = {
          limit: 4,
        };
        const response =
          await APIs.frontend.category.getPopularCategories(params);
        if (!isActive) return;
        const categories = response?.data;
        setTourCategories(
          Array.isArray(categories)
            ? categories.map((category, index) => ({
                ...category,
                ...(imageLayout[index] ?? null),
              }))
            : [],
        );
      } catch (failure) {
        if (!isActive) return;
        setError(
          failure.message || "Unable to load categories. Please try again.",
        );
        setTourCategories([]);
      } finally {
        if (isActive) setIsLoading(false);
      }
    }
    void loadCategories();
    return () => {
      isActive = false;
    };
  }, []);

  if (!isLoading && !error && tourCategories.length === 0) return null;

  return (
    <div className="container relative">
      <div className="grid grid-cols-1 pb-8 text-center">
        <h3 className="mb-6 md:text-3xl text-2xl md:leading-normal leading-normal font-semibold">
          Explore Tour Categories
        </h3>

        <p className="text-slate-400 max-w-xl mx-auto">
          From royal heritage tours to romantic honeymoons and family getaways,
          find the perfect way to explore India with Prestige Pathway.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:auto-rows-[clamp(10rem,16vw,14rem)] lg:grid-cols-4">
        {tourCategories.map((category) => (
          <Link
            key={category.slug}
            href={{ pathname: "/category", query: { category: category.slug } }}
            className={`group relative isolate block min-h-64 overflow-hidden rounded-lg bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary dark:bg-slate-800 lg:min-h-0 ${category.layout ?? ""}`}
          >
            <ImagePreview
              src={category.image_url}
              alt={category.title}
              fill
              sizes={
                category.featured || category.layout
                  ? "(min-width: 960px) 50vw, (min-width: 640px) 50vw, 100vw"
                  : "(min-width: 960px) 25vw, (min-width: 640px) 50vw, 100vw"
              }
              className={`object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${category.imagePosition ?? "object-center"}`}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-950/85 via-slate-900/10 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 p-5 lg:p-4 xl:p-5">
              <h4 className="min-w-0 text-lg font-medium text-white hover:text-primary duration-500 ease-in-out drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)]">
                {category.title}
              </h4>
              <span
                aria-hidden="true"
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-white/60 bg-white/10 text-white shadow-sm backdrop-blur-sm transition-colors group-hover:border-primary group-hover:bg-primary group-focus-visible:border-primary group-focus-visible:bg-primary motion-reduce:transition-none"
              >
                <FiArrowRight className="text-lg" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
