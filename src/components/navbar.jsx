"use client";
import React, { useState, useEffect, useRef } from "react";

import Link from "next/link";
import Image from "next/image";
import {
  FiSearch,
  FiUser,
  FiHelpCircle,
  FiSettings,
  FiLogOut,
} from "react-icons/fi";

export default function Navbar({ navclass, navlight, manuclass }) {
  let [scrolling, setScrolling] = useState(false);
  let [isToggle, setToggle] = useState(false);
  let [manu, setManu] = useState("");
  let [subManu, setSubManu] = useState("");
  let [isOpen, setIsOpen] = useState(false);
  let [userManu, setUserManu] = useState(false);

  let dropdownRef = useRef(null);
  let userRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolling = window.scrollY > 50;
      setScrolling(isScrolling);
    };

    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const userOutsideClick = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserManu(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("click", handleOutsideClick);
    window.addEventListener("click", userOutsideClick);

    let current = window.location.pathname;
    setManu(current);
    setSubManu(current);
    window.scrollTo(0, 0);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("click", handleOutsideClick);
      window.removeEventListener("click", userOutsideClick);
    };
  }, []);

  const toggleMenu = () => {
    setToggle(!isToggle);
  };

  return (
    <nav id="topnav" className={`${navclass} ${scrolling ? "nav-sticky" : ""}`}>
      <div className="container relative">
        {navlight && (
          <Link className="logo" href="/">
            <span className="inline-block dark:hidden">
              <Image
                src="/images/logo/logo.png"
                loading="eager"
                width={180}
                height={90}
                className="h-18 l-dark"
                alt=""
              />
              <Image
                src="/images/logo/logo-theme.png"
                loading="eager"
                width={180}
                height={90}
                className="h-18 l-light"
                alt=""
              />
            </span>
            <Image
              src="/images/logo/logo.png"
              loading="eager"
              width={133}
              height={28}
              className="hidden dark:inline-block"
              alt=""
            />
          </Link>
        )}
        {!navlight && (
          <Link className="logo" href="/">
            <div>
              <Image
                src="/images/logo-dark.png"
                loading="eager"
                width={133}
                height={28}
                className="h-7 inline-block dark:hidden"
                alt=""
              />
              <Image
                src="/images/logo/logo.png"
                loading="eager"
                width={133}
                height={28}
                className="h-7 hidden dark:inline-block"
                alt=""
              />
            </div>
          </Link>
        )}

        <div className="menu-extras">
          <div className="menu-item">
            <Link
              href="#"
              className={`navbar-toggle ${isToggle ? "open" : ""}`}
              id="isToggle"
              onClick={() => toggleMenu()}
            >
              <div className="lines">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </Link>
          </div>
        </div>

        <div
          id="navigation"
          style={{ display: isToggle === true ? "block" : "none" }}
        >
          <ul className={`navigation-menu ${manuclass}`}>
            <li
              className={`has-submenu parent-menu-item ${["/"].includes(manu) ? "active" : ""}`}
            >
              <Link href="/">Home</Link>
            </li>

            <li
              className={`has-submenu parent-menu-item ${["/domestic-tours", "/international-tours", "/packages"].includes(manu) ? "active" : ""}`}
            >
              <Link
                href=""
                onClick={() =>
                  setSubManu(subManu === "/packages" ? "" : "/packages")
                }
              >
                Tour Packages
              </Link>
              <span className="menu-arrow"></span>
              <ul
                className={`submenu ${["/domestic-tours", "/international-tours", "/packages"].includes(subManu) ? "open" : ""}`}
              >
                <li className={`${manu === "/domestic-tours" ? "active" : ""}`}>
                  <Link href="/domestic-tours" className="sub-menu-item">
                    {" "}
                    Domestic Tours
                  </Link>
                </li>
                <li
                  className={`${manu === "/international-tours" ? "active" : ""}`}
                >
                  <Link href="/international-tours" className="sub-menu-item">
                    {" "}
                    International Tours
                  </Link>
                </li>
              </ul>
            </li>

            <li
              className={`has-submenu parent-menu-item ${["/domestic-destinations", "/international-destinations", "/destinations"].includes(manu) ? "active" : ""}`}
            >
              <Link
                href=""
                onClick={() =>
                  setSubManu(subManu === "/destinations" ? "" : "/destinations")
                }
              >
                Destinations
              </Link>
              <span className="menu-arrow"></span>
              <ul
                className={`submenu ${["/domestic-destinations", "/international-destinations", "/destinations"].includes(subManu) ? "open" : ""}`}
              >
                <li
                  className={`${manu === "/domestic-destinations" ? "active" : ""}`}
                >
                  <Link href="/domestic-destinations" className="sub-menu-item">
                    {" "}
                    Domestic Destinations
                  </Link>
                </li>
                <li
                  className={`${manu === "/international-destinations" ? "active" : ""}`}
                >
                  <Link
                    href="/international-destinations"
                    className="sub-menu-item"
                  >
                    {" "}
                    International Destinations
                  </Link>
                </li>
              </ul>
            </li>

            <li className={`${manu === "/car-rentals" ? "active" : ""}`}>
              <Link href="/car-rentals" className="sub-menu-item">
                Car Rentals
              </Link>
            </li>

            <li className={`${manu === "/contact" ? "active" : ""}`}>
              <Link href="/contact" className="sub-menu-item">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
