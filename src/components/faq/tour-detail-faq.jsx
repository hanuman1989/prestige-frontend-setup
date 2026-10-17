'use client'
import React, { useState } from "react";
import { FiChevronUp } from 'react-icons/fi'
import { faqData } from "../../data/data";

export default function TourDetailFaq(){
    let [activeTab, setActiveTab] = useState(1)

    return(
        <div className="mt-6">
            {faqData.slice(0,4).map((item,index)=>{
                return(
                    <div className="relative shadow-sm dark:shadow-gray-800 rounded-md overflow-hidden mt-4 first:mt-0" key={index}>
                        <h2 className="text-base font-semibold">
                            <button type="button" className={`flex justify-between items-center p-5 w-full font-medium text-start ${activeTab === item.id ? 'bg-gray-50 dark:bg-slate-800 text-primary' : '' }`} onClick={()=>setActiveTab(item.id)}>
                                <span>{item.title}</span>
                                <FiChevronUp className={`size-4 shrink-0 ${activeTab === item.id ? '' : 'rotate-180'}`}/>
                            </button>
                        </h2>
                        <div className={activeTab === item.id ? "" : "hidden"}>
                            <div className="p-5">
                                <p className="text-slate-400 dark:text-gray-400">{item.desc}</p>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
