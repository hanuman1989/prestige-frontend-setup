import React from "react";
import Link from "next/link";

import {FiArrowLeft} from 'react-icons/fi'

export default function BackToHome(){
    return(
        <div className="fixed bottom-3 inset-e-3 z-10">
            <Link href="/" className="back-button size-8 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-base text-center bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-md"><FiArrowLeft className="size-4"></FiArrowLeft></Link>
        </div>
    )
}