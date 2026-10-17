import React from "react";

import {
  FiClock,
  FiMapPin,
  FiMail,
  FiFacebook,
  FiInstagram,
  FiTwitter,
  FiPhone,
} from "react-icons/fi";

export default function Tagline() {
  return (
    <>
      <div className="tagline bg-slate-900">
        <div className="container relative">
          <div className="grid grid-cols-1">
            <div className="flex items-center justify-between">
              {/* <ul className="list-none space-x-2">
                <li className="inline-flex items-center">
                  <FiClock className="text-primary size-4"></FiClock>
                  <span className="ms-2 text-slate-300">
                    Mon-Sat: 9am to 6pm
                  </span>
                </li>
                <li className="inline-flex items-center ms-2">
                  <FiMapPin className="text-primary size-4"></FiMapPin>
                  <span className="ms-2 text-slate-300">Houston, USA 485</span>
                </li>
              </ul> */}
              <div></div>

              <ul className="list-none">
                <li className="inline-flex items-center">
                  <FiMail className="text-primary size-4"></FiMail>
                  <a
                    href="mailto:contact@example.com"
                    className="ms-2 text-slate-300 hover:text-slate-200"
                  >
                    contact@example.com
                  </a>
                </li>
                <li className="inline-flex items-center ms-2">
                  <ul className="list-none space-x-3">
                    <li className="inline-flex mb-0">
                      <a
                        href="#!"
                        className="text-slate-300 hover:text-primary"
                      >
                        <FiFacebook
                          className="size-4 align-middle"
                          title="facebook"
                        ></FiFacebook>
                      </a>
                    </li>
                    <li className="inline-flex ms-2 mb-0">
                      <a
                        href="#!"
                        className="text-slate-300 hover:text-primary"
                      >
                        <FiInstagram
                          className="size-4 align-middle"
                          title="instagram"
                        ></FiInstagram>
                      </a>
                    </li>
                    <li className="inline-flex ms-2 mb-0">
                      <a
                        href="#!"
                        className="text-slate-300 hover:text-primary"
                      >
                        <FiTwitter
                          className="size-4 align-middle"
                          title="twitter"
                        ></FiTwitter>
                      </a>
                    </li>
                    <li className="inline-flex ms-2 mb-0">
                      <a
                        href="tel:+152534-468-854"
                        className="text-slate-300 hover:text-primary"
                      >
                        <FiPhone
                          className="size-4 align-middle"
                          title="phone"
                        ></FiPhone>
                      </a>
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
