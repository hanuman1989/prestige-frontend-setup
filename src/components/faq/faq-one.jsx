'use client'
import React, { useState } from 'react';

import {faqData} from '../../data/data'

import {FiChevronDown} from 'react-icons/fi'

export default function FaqOne(){
    let [activeIndex, setActiveIndex] = useState(1)
    return(
        <div className="md:col-span-6">
            <div>
                {faqData.map((item,index)=>{
                    return(
                        <div className="relative shadow-sm dark:shadow-gray-800 rounded-md overflow-hidden mt-4 first:mt-0" key={index}>
                            <h2 className="text-base font-semibold" id="accordion-collapse-heading-1">
                                <button type="button" className={`flex justify-between items-center p-5 w-full font-medium text-start ${activeIndex === item.id ? 'bg-gray-50 dark:bg-slate-800 text-primary' : ''}`} onClick={()=>setActiveIndex(item.id)}>
                                    <span>{item.title}</span>
                                    <FiChevronDown className={`w-4 h-4 shrink-0 ${activeIndex === item.id ? 'rotate-180' : ''}`}></FiChevronDown>
                                </button>
                            </h2>
                            <div className={activeIndex === item.id ? "" : "hidden" }>
                                <div className="p-5">
                                    <p className="text-slate-400 dark:text-gray-400">{item.desc}</p>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}