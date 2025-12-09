import React from 'react'
import { FaTelegram, FaWhatsapp } from 'react-icons/fa'
import Link from 'next/link'

const Footer = () => {
    return (
        <>
            <footer className="bg-gc-900 pt-12 pb-8 px-2 md:px-10 tracking-wide ">
                <div className="container">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="lg:flex items-start flex-col">
                            {/* <a href="#">
                                <Image src={logo} alt="logo" className="w-48" />
                            </a> */}
                            <h2 className='text-white text-[5vh]  font-extrabold italic' >Zelton</h2>
                            <p className='text-white lg:text-base text-sm mt-5'>
                                Your trusted hub for gaming account trading.
                                Fast, secure, and hassle-free deals.
                                Play smarter, trade safer – only on Zelton. </p>
                        </div>

                        <div className="">
                            <h2 className='text-base mb-4 text-white'>Contact Us</h2>
                            <ul className="flex gap-6">
                                <li>
                                    <a target='_blank'>
                                        <FaWhatsapp className='text-green-600 size-10' />
                                    </a>
                                </li>

                                <li>
                                    <a target='_blank'>

                                        <FaTelegram className='text-blue-400 size-10' />
                                    </a>
                                </li>
                                <li>
                                    <a target='_blank'>
                                        <svg xmlns="http://www.w3.org/2000/svg" className='size-10' viewBox="0 0 152 152">
                                            <linearGradient id="a" x1="22.26" x2="129.74" y1="22.26" y2="129.74" gradientUnits="userSpaceOnUse">
                                                <stop offset="0" stopColor="#fae100" />
                                                <stop offset=".15" stopColor="#fcb720" />
                                                <stop offset=".3" stopColor="#ff7950" />
                                                <stop offset=".5" stopColor="#ff1c74" />
                                                <stop offset="1" stopColor="#6c1cd1" />
                                            </linearGradient>
                                            <g data-name="Layer 2">
                                                <g data-name="03.Instagram">
                                                    <rect width="152" height="152" fill="url(#a)" data-original="url(#a)" rx="76" />
                                                    <g fill="#fff">
                                                        <path fill="#ffffff10" d="M133.2 26c-11.08 20.34-26.75 41.32-46.33 60.9S46.31 122.12 26 133.2q-1.91-1.66-3.71-3.46A76 76 0 1 1 129.74 22.26q1.8 1.8 3.46 3.74z" data-original="#ffffff10" />
                                                        <path d="M94 36H58a22 22 0 0 0-22 22v36a22 22 0 0 0 22 22h36a22 22 0 0 0 22-22V58a22 22 0 0 0-22-22zm15 54.84A18.16 18.16 0 0 1 90.84 109H61.16A18.16 18.16 0 0 1 43 90.84V61.16A18.16 18.16 0 0 1 61.16 43h29.68A18.16 18.16 0 0 1 109 61.16z" data-original="#ffffff" />
                                                        <path d="m90.59 61.56-.19-.19-.16-.16A20.16 20.16 0 0 0 76 55.33 20.52 20.52 0 0 0 55.62 76a20.75 20.75 0 0 0 6 14.61 20.19 20.19 0 0 0 14.42 6 20.73 20.73 0 0 0 14.55-35.05zM76 89.56A13.56 13.56 0 1 1 89.37 76 13.46 13.46 0 0 1 76 89.56zm26.43-35.18a4.88 4.88 0 0 1-4.85 4.92 4.81 4.81 0 0 1-3.42-1.43 4.93 4.93 0 0 1 3.43-8.39 4.82 4.82 0 0 1 3.09 1.12l.1.1a3.05 3.05 0 0 1 .44.44l.11.12a4.92 4.92 0 0 1 1.1 3.12z" data-original="#ffffff" />
                                                    </g>
                                                </g>
                                            </g>
                                        </svg>
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-base mb-4 text-white">Useful links</h4>
                            <ul className="space-y-4">
                                <li>
                                    <Link href="/" className="text-slate-400 hover:text-white text-sm">Featured</Link>
                                </li>
                                <li>
                                    <Link href="/upcoming-feature" className="text-slate-400 hover:text-white text-sm">New Arrivals</Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-base mb-4 text-white">Information</h4>
                            <ul className="space-y-4">
                                <li>
                                    <Link href="/about_us" className="text-slate-400 hover:text-white text-sm">About Us</Link>
                                </li>
                                <li>
                                    <Link href="/terms-conditions" className="text-slate-400 hover:text-white text-sm">Terms &amp; Conditions</Link >
                                </li>
                                <li>
                                    <Link href="/privacy-policy" className="text-slate-400 hover:text-white text-sm">Privacy Policy</Link>
                                </li>
                                <li>
                                    <Link href="/refund-policy" className="text-slate-400 hover:text-white text-sm">Refund & Cancellation Policy</Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <p className="text-slate-400 text-sm mt-10">Developed By @ArrayLog</p>
                </div>
                <br />
                <hr className='bg-white/50 ' />
                <p className='text-slate-400 text-center pt-10 text-sm capitalize ' >
                    ALL RIGHT RESERVED WITH DEPTHROUTE TECHNOLOGY PRIVATE LIMITED
                </p>
            </footer>
        </>
    )
}

export default Footer