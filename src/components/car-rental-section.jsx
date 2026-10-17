import Image from "next/image";
import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { TbCar, TbPlane, TbRoad } from "react-icons/tb";

const services = [
  { label: "Local Sightseeing", icon: TbCar },
  { label: "Airport Transfers", icon: TbPlane },
  { label: "Outstation Trips", icon: TbRoad },
];

const vehicleCategories = [
  {
    slug: "sedan",
    label: "Sedan",
    title: "Sedan Cars",
    description: "A comfortable choice for city rides and small groups.",
    image: "/images/cars/sedan.png",
    alt: "White sedan photographed in a light gray studio",
  },
  {
    slug: "suv",
    label: "SUV",
    title: "SUV Cars",
    description: "More space and comfort for your next road trip.",
    image: "/images/cars/suv.png",
    alt: "White SUV photographed in a light gray studio",
  },
  {
    slug: "tempo-traveller",
    label: "Group Travel",
    title: "Tempo Traveller",
    description: "Travel together comfortably with family and friends.",
    image: "/images/cars/tempo-traveller.png",
    alt: "White high-roof passenger minibus photographed in a light gray studio",
  },
];

const linkFocus =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary";

export default function CarRentalSection() {
  return (
    <div className="container relative md:mt-15 mt-15">
      <div className="text-center">
        <h2
          id="car-rental-heading"
          className="mb-6 md:text-3xl text-2xl md:leading-normal leading-normal font-semibold"
        >
          Car Rental Services
        </h2>
        <p className="text-slate-400 max-w-xl mx-auto">
          Comfortable rides for Jaipur sightseeing, airport transfers
          <br className="hidden sm:block" /> and outstation journeys.
        </p>

        <ul
          aria-label="Car rental services"
          className="mt-8 flex flex-wrap justify-center gap-3 sm:gap-6"
        >
          {services.map(({ label, icon: Icon }) => (
            <li
              key={label}
              className="inline-flex min-h-15 items-center justify-center gap-4 rounded-lg border border-slate-200 bg-white px-6 py-3 font-medium text-slate-900 sm:min-w-57.5 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <Icon
                aria-hidden="true"
                className="size-8 shrink-0 text-primary"
                strokeWidth={1.5}
              />
              {label}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {vehicleCategories.map((vehicle) => (
          <article
            key={vehicle.slug}
            className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-900"
          >
            <Image
              src={vehicle.image}
              alt={vehicle.alt}
              width={840}
              height={560}
              sizes="(min-width: 1400px) 440px, (min-width: 960px) 33vw, (min-width: 720px) 50vw, 100vw"
              className="aspect-3/2 w-full rounded-md object-cover"
            />

            <div className="flex flex-1 flex-col px-3.5 pb-2 pt-4">
              <p className="text-base font-medium uppercase tracking-wide text-primary">
                {vehicle.label}
              </p>
              <h3 className="text-lg font-medium hover:text-primary duration-500 ease-in-out">
                {vehicle.title}
              </h3>
              <p className="mb-6 mt-2 leading-7! text-slate-400 ">
                {vehicle.description}
              </p>

              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-lg dark:border-slate-700">
                <Link
                  href={{
                    pathname: "/contact",
                    query: { vehicle: vehicle.slug },
                  }}
                  aria-label={`Enquire about ${vehicle.title}`}
                  className={`inline-flex items-center gap-2 text-primary transition-colors hover:text-primary-600 ${linkFocus}`}
                >
                  Enquire Now <FiArrowRight aria-hidden="true" />
                </Link>
                <Link
                  href={{
                    pathname: "/car-rentals",
                    query: { category: vehicle.slug },
                  }}
                  aria-label={`View ${vehicle.title}`}
                  className={`inline-flex items-center gap-2 text-slate-400 hover:text-primary ${linkFocus}`}
                >
                  View Cars <FiArrowRight aria-hidden="true" />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/car-rentals"
          className={`inline-flex items-center justify-center gap-3 py-2 px-5 inline-block tracking-wide align-middle duration-500 text-base text-center bg-primary text-white rounded-md ${linkFocus}`}
        >
          Explore All Cars <FiArrowRight aria-hidden="true" />
        </Link>
        <p className="mt-3 text-base text-slate-400">
          Need help choosing a vehicle?{" "}
          <Link
            href="/contact"
            className={`text-primary transition-colors hover:text-primary-600 ${linkFocus}`}
          >
            Talk to our team.
          </Link>
        </p>
      </div>
    </div>
  );
}
