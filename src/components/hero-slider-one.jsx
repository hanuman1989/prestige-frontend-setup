"use client";
import Link from "next/link";
import Image from "next/image";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import "swiper/swiper-bundle.css";

export default function HeroSliderOne() {
  return (
    <section className="swiper-slider-hero relative block h-screen" id="home">
      <div className="swiper-container absolute inset-e-0 top-0 w-full h-full">
        <Swiper
          className="swiper-wrapper"
          loop={true}
          speed={2000}
          autoplay={{ delay: 6500 }}
          effect="flip"
          modules={[Autoplay, EffectFade]}
        >
          <SwiperSlide className="swiper-slide flex items-center overflow-hidden">
            <div
              className="slide-inner absolute inset-e-0 top-0 w-full h-full slide-bg-image flex items-center bg-center"
              style={{ backgroundImage: `url('/images/hero/1.png')` }}
            >
              <div className="absolute inset-0 bg-slate-900/70"></div>
              <div className="container relative">
                <div className="grid grid-cols-1">
                  <div className="text-center">
                    <Image
                      src="/images/map-plane.png"
                      width={0}
                      height={0}
                      sizes="100vw"
                      style={{ width: "300px", height: "auto" }}
                      className="mx-auto w-75"
                      alt=""
                    />
                    <h1 className="font-bold text-white lg:leading-normal leading-normal text-4xl lg:text-6xl mb-6 mt-5">
                      Discover the World. Your Way
                    </h1>
                    <p className="text-white/70 text-xl max-w-xl mx-auto">
                      From India’s vibrant heritage to remarkable destinations
                      abroad, explore domestic and international tours
                      thoughtfully planned around you
                    </p>

                    <div className="mt-6">
                      <Link
                        href="/packages"
                        className="py-2 px-5 inline-block tracking-wide align-middle duration-500 text-base text-center bg-primary text-white 
                        rounded-md"
                      >
                        Explore Our Tours
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>

          <SwiperSlide className="swiper-slide flex items-center overflow-hidden">
            <div
              className="slide-inner absolute inset-e-0 top-0 w-full h-full slide-bg-image flex items-center bg-center"
              style={{ backgroundImage: `url('/images/hero/2.png')` }}
            >
              <div className="absolute inset-0 bg-slate-900/70"></div>
              <div className="container relative">
                <div className="grid grid-cols-1">
                  <div className="text-center">
                    <img
                      src="/images/map-plane.png"
                      width={0}
                      height={0}
                      sizes="100vw"
                      style={{ width: "300px", height: "auto" }}
                      className="mx-auto w-75"
                      alt=""
                    />
                    <h1 className="font-bold text-white lg:leading-normal leading-normal text-4xl lg:text-6xl mb-6 mt-5">
                      Find Next Best <br /> Place To Visit
                    </h1>
                    <p className="text-white/70 text-xl max-w-xl mx-auto">
                      Planning for a trip? We will organize your trip with the
                      best places and within best budget!
                    </p>

                    <div className="mt-6">
                      <Link
                        href="/destinations"
                        className="py-2 px-5 inline-block tracking-wide align-middle duration-500 text-base text-center bg-primary text-white rounded-md"
                      >
                        See More
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>

          <SwiperSlide className="swiper-slide flex items-center overflow-hidden">
            <div
              className="slide-inner absolute inset-e-0 top-0 w-full h-full slide-bg-image flex items-center bg-center"
              style={{ backgroundImage: `url('/images/hero/6.png')` }}
            >
              <div className="absolute inset-0 bg-slate-900/70"></div>
              <div className="container relative">
                <div className="grid grid-cols-1">
                  <div className="text-center">
                    <img
                      src="/images/map-plane.png"
                      width={0}
                      height={0}
                      sizes="100vw"
                      style={{ width: "300px", height: "auto" }}
                      className="mx-auto w-75"
                      alt=""
                    />
                    <h1 className="font-bold text-white lg:leading-normal leading-normal text-4xl lg:text-6xl mb-6 mt-5">
                      Your Journey. Your Ride. Your Way
                    </h1>
                    <p className="text-white/70 text-xl max-w-xl mx-auto">
                      From city sightseeing to outstation adventures, travel
                      comfortably with our car rental services—planned around
                      your route and your pace.
                    </p>

                    <div className="mt-6">
                      <Link
                        href="/car-rentals"
                        className="py-2 px-5 inline-block tracking-wide align-middle duration-500 text-base text-center bg-primary text-white rounded-md"
                      >
                        Explore All cars
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>

          <SwiperSlide className="swiper-slide flex items-center overflow-hidden">
            <div
              className="slide-inner absolute inset-e-0 top-0 w-full h-full slide-bg-image flex items-center bg-center"
              style={{ backgroundImage: `url('/images/hero/7.png')` }}
            >
              <div className="absolute inset-0 bg-slate-900/70"></div>
              <div className="container relative">
                <div className="grid grid-cols-1">
                  <div className="text-center">
                    <img
                      src="/images/map-plane.png"
                      width={0}
                      height={0}
                      sizes="100vw"
                      style={{ width: "300px", height: "auto" }}
                      className="mx-auto w-75"
                      alt=""
                    />
                    <h1 className="font-bold text-white lg:leading-normal leading-normal text-4xl lg:text-6xl mb-6 mt-5">
                      Every Destination, a New Story.
                    </h1>
                    <p className="text-white/70 text-xl max-w-xl mx-auto">
                      Explore India’s timeless heritage and the world’s
                      remarkable places, with journeys thoughtfully planned
                      around you.
                    </p>

                    <div className="mt-6">
                      <Link
                        href="/destination"
                        className="py-2 px-5 inline-block tracking-wide align-middle duration-500 text-base text-center bg-primary text-white rounded-md"
                      >
                        Explore Destinations
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>
      </div>
    </section>
  );
}
