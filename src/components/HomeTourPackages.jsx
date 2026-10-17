"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { packages } from "@/app/data/data";
import APIs from "@/lib/apis";
import { FiMapPin, FiClock } from "react-icons/fi";
import ImagePreview from "@/components/common/ImagePreview";

export default function HomeTourPackages() {
  const [tourPackages, setTourPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;
    async function loadPackages() {
      setIsLoading(true);
      try {
        const params = {
          limit: 6,
        };
        const response = await APIs.frontend.package.getSpecialPackages(params);
        if (!isActive) return;
        const packages = response?.data;
        setTourPackages(Array.isArray(packages) ? packages : []);
      } catch (failure) {
        if (!isActive) return;
        setError(
          failure.message || "Unable to load packages. Please try again.",
        );
        setTourPackages([]);
      } finally {
        if (isActive) setIsLoading(false);
      }
    }
    void loadPackages();
    return () => {
      isActive = false;
    };
  }, []);

  if (!isLoading && !error && tourPackages.length === 0) return null;

  return (
    <div className="container relative">
      <div className="grid grid-cols-1 pb-8 text-center">
        <h3 className="mb-6 md:text-3xl text-2xl md:leading-normal leading-normal font-semibold">
          Discover Your Perfect Journey
        </h3>

        <p className="text-slate-400 max-w-xl mx-auto">
          Explore thoughtfully crafted tour packages, from Rajasthan’s royal
          heritage to India’s scenic escapes, for a journey filled with comfort
          and memorable experiences.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 mt-6 gap-6">
        {tourPackages.map((item, index) => {
          return (
            <div
              className="group rounded-md shadow-sm dark:shadow-gray-700"
              key={index}
            >
              <div className="relative overflow-hidden rounded-t-md shadow-sm dark:shadow-gray-700 mx-3 mt-3">
                <ImagePreview
                  src={item.cover_image_url}
                  width={0}
                  height={0}
                  sizes="100vw"
                  style={{ width: "100%", height: "auto" }}
                  className="scale-125 group-hover:scale-100 duration-500"
                  alt=""
                />
                {item.tagText && (
                  <div className="absolute top-0 inset-s-0 p-4">
                    <span className="bg-primary text-white text-[12px] px-2.5 py-1 font-medium rounded-md h-5">
                      Recommended
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h4 className="text-sm leading-normal tracking-[.25em] font-semibold text-primary mb-2">
                  Golden Triangle Tours
                </h4>

                <Link
                  href={`/tour-detail-one/${item.id}`}
                  className="text-lg font-medium hover:text-primary duration-500 ease-in-out "
                >
                  {item.title}
                </Link>
                <hr className="my-4 h-px border-0 bg-gray-200" />
                <div className="mb-2">
                  <span className="text-sm uppercase text-slate-400 tracking-[.25em]">
                    {item.cities_covered.map((city, index) => (
                      <span key={`${index}-${city}`}>
                        {index > 0 && " · "}
                        {city}
                      </span>
                    ))}
                  </span>
                  <p className="flex items-center font-medium ">
                    <FiMapPin className="text-primary size-4 me-1 "></FiMapPin>{" "}
                    {item.place}
                  </p>
                </div>

                <div>
                  <span className="text-sm uppercase text-slate-400 tracking-[.25em]">
                    Best Time To Visit
                  </span>
                  <p className="flex items-center font-medium ">
                    <FiClock className="size-4 text-primary dark:text-white me-1.5"></FiClock>
                    8 Nights 9 Days
                  </p>
                </div>

                <div className="mt-4 pt-4 flex justify-between items-center border-t border-slate-100 dark:border-gray-800">
                  <div></div>
                  <Link href="" className="text-slate-400 hover:text-primary">
                    Explore Now <i className="mdi mdi-arrow-right"></i>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/packages"
          className="text-slate-400 hover:text-primary inline-block"
        >
          See More Tours <i className="mdi mdi-arrow-right align-middle"></i>
        </Link>
      </div>
    </div>
  );
}
