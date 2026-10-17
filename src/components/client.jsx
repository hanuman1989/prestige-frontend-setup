"use client";
import React from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Autoplay, Pagination, Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/a11y";
import "swiper/css/pagination";
import "swiper/css/navigation";

import styles from "./client.module.css";

const ClientData = [
  {
    image: "/images/client/01.jpg",
    desc: '" It seems that only fragments of the original text remain in the Lorem Ipsum texts used today. "',
    name: "Calvin Carlo",
    possition: "Manager",
  },
  {
    image: "/images/client/02.jpg",
    desc: '"The most well-known dummy text is the Lorem Ipsum, which is said to have originated in the 16th century."',
    name: "Christa Smith",
    possition: "Manager",
  },
  {
    image: "/images/client/03.jpg",
    desc: '" One disadvantage of Lorum Ipsum is that in Latin certain letters appear more frequently than others. "',
    name: "Jemina CLone",
    possition: "Manager",
  },
  {
    image: "/images/client/04.jpg",
    desc: '" Thus, Lorem Ipsum has only limited suitability as a visual filler for German texts. "',
    name: "Smith Vodka",
    possition: "Manager",
  },
  {
    image: "/images/client/05.jpg",
    desc: '" There is now an abundance of readable dummy texts. These are usually used when a text is required. "',
    name: "Cristino Murfi",
    possition: "Manager",
  },
  {
    image: "/images/client/06.jpg",
    desc: '" According to most sources, Lorum Ipsum can be traced back to a text composed by Cicero. "',
    name: "Cristino Murfi",
    possition: "Manager",
  },
];

const breakpoints = {
  767: { slidesPerView: 2 },
  992: { slidesPerView: 3 },
};

export default function Client() {
  return (
    <div className="container relative md:mt-15 mt-15">
      <div className="grid grid-cols-1 pb-6 text-center">
        <h3 className="mb-6 md:text-3xl text-2xl md:leading-normal leading-normal font-semibold">
          What Our Users Say
        </h3>

        <p className="text-slate-400 max-w-xl mx-auto">
          This is just a simple text made for this unique and awesome template,
          you can replace it with any text.
        </p>
      </div>

      <div className="grid grid-cols-1 mt-6">
        <Swiper
          modules={[A11y, Autoplay, Pagination, Navigation]}
          slidesPerView={1}
          breakpoints={breakpoints}
          spaceBetween={12}
          speed={400}
          loop
          grabCursor
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          className={`${styles.slider} custom-pagination`}
          role="region"
          aria-label="User testimonials"
        >
          {ClientData.map((item) => (
            <SwiperSlide className="text-center" key={item.image}>
              <div className="cursor-e-resize">
                <div className="content relative rounded shadow-sm dark:shadow-gray-700 m-2 p-6 bg-white dark:bg-slate-900 before:content-[''] before:absolute before:inset-s-1/2 before:-bottom-1 before:box-border before:border-8 before:rotate-45 before:border-t-transparent before:border-e-white dark:before:border-e-slate-900 before:border-b-white dark:before:border-b-slate-900 before:border-s-transparent before:shadow-testi dark:before:shadow-gray-700 before:origin-top-left">
                  <i className="mdi mdi-format-quote-open mdi-48px text-primary"></i>
                  <p className="text-slate-400">{item.desc}</p>
                </div>

                <div className="text-center mt-5">
                  {/* <Image
                    src={item.image}
                    height={56}
                    width={56}
                    className="size-14 rounded-full shadow-md dark:shadow-gray-700 mx-auto"
                    alt=""
                  /> */}
                  <h6 className="mt-2 font-semibold">{item.name}</h6>
                  <span className="text-slate-400 text-sm">
                    {item.possition}
                  </span>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}
