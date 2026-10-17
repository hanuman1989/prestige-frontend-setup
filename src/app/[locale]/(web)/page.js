import About from "@/components/about";
import Client from "@/components/client";
import Footer from "@/components/footer";
import HeroSliderOne from "@/components/hero-slider-one";
import Navbar from "@/components/navbar";
import Tagline from "@/components/tagline";
import TopDestinationOne from "@/components/top-destination-one";
import CarRentalSection from "@/components/car-rental-section";
import TourCategories from "@/components/tour-categories";
import HomeTourPackages from "@/components/HomeTourPackages";

export default function Home() {
  return (
    <>
      <Tagline />
      <Navbar
        navclass="defaultscroll is-sticky tagline-height"
        navlight={true}
        manuclass="justify-end! nav-light"
      />
      <HeroSliderOne />
      <section className="relative md:py-15 py-12 overflow-hidden">
        <TopDestinationOne />
        <div className="md:py-15 py-12">
          <TourCategories />
        </div>
        <HomeTourPackages />

        <CarRentalSection />
        <Client />
      </section>
      <Footer />
    </>
  );
}
