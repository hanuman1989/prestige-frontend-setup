"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import APIs from "@/lib/apis";
import TopDestinationSkeleton from "@/components/skeleton/TopDestinationSkeleton";
import { Swiper, SwiperSlide, useSwiper } from "swiper/react";
import { A11y } from "swiper/modules";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

import "swiper/css";
import "swiper/css/a11y";

const breakpoints = {
  767: { slidesPerView: 3 },
  992: { slidesPerView: 4 },
  1025: { slidesPerView: 5 },
};

function DestinationControls() {
  const swiper = useSwiper();

  return (
    <div className="tns-controls">
      <button
        type="button"
        data-controls="prev"
        aria-label="Previous destination"
        onClick={() => swiper.slidePrev()}
        className="flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <FiChevronLeft aria-hidden="true" />
      </button>
      <button
        type="button"
        data-controls="next"
        aria-label="Next destination"
        onClick={() => swiper.slideNext()}
        className="flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <FiChevronRight aria-hidden="true" />
      </button>
    </div>
  );
}

export default function TopDestinationOne({ skeletonCount = 5 }) {
  const [topDestination, setTopDestination] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let isActive = true;
    async function loadDestinations() {
      try {
        const response = await APIs.frontend.destination.getTopDestination();
        if (!isActive) return;
        const destinations = response?.data;
        setTopDestination(Array.isArray(destinations) ? destinations : []);
      } catch (failure) {
        if (!isActive) return;
        setError(
          failure.message ||
            "Unable to load top destinations. Please try again.",
        );
        setTopDestination([]);
      } finally {
        if (isActive) setIsLoading(false);
      }
    }
    void loadDestinations();
    return () => {
      isActive = false;
    };
  }, []);

  if (!isLoading && !error && topDestination.length === 0) return null;

  return (
    <div className="container relative">
      <div className="grid grid-cols-1 pb-8 text-center">
        <h3 className="mb-6 md:text-3xl text-2xl md:leading-normal leading-normal font-semibold">
          Top Destinations
        </h3>

        <p className="text-slate-400 max-w-xl mx-auto">
          Planning for a trip? We will organize your trip with the best places
          and within best budget!
        </p>
      </div>

      <div className="grid grid-cols-1 relative mt-6" aria-busy={isLoading}>
        {isLoading ? (
          <TopDestinationSkeleton count={skeletonCount} />
        ) : error ? (
          <p
            role="alert"
            className="py-8 text-center text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        ) : (
          <Swiper
            modules={[A11y]}
            slidesPerView={1}
            breakpoints={breakpoints}
            loop
            grabCursor
            speed={400}
            className="w-full min-w-0"
            role="region"
            aria-label="Top destinations"
          >
            {topDestination.map((item) => (
              <SwiperSlide key={item.slug}>
                <div className="group relative overflow-hidden rounded-md shadow-sm dark:shadow-gray-800 m-2">
                  <Image
                    src={item.image_url}
                    width={0}
                    height={0}
                    sizes="100vw"
                    style={{ width: "100%", height: "288px" }}
                    className="w-full h-72 object-cover scale-125 group-hover:scale-100 duration-500"
                    alt=""
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-linear-to-b to-slate-900 from-transparent opacity-0 group-hover:opacity-100 duration-500"></div>
                  <div className="absolute p-4 bottom-0 inset-s-0">
                    <Link
                      href=""
                      className="text-lg font-medium text-white hover:text-primary duration-500 ease-in-out"
                    >
                      {item.title}
                    </Link>
                    <p className="text-white/70 group-hover:text-white text-sm duration-500">
                      {item.count_packages}
                    </p>
                  </div>
                </div>
              </SwiperSlide>
            ))}
            <DestinationControls slot="container-end" />
          </Swiper>
        )}
      </div>
    </div>
  );
}
