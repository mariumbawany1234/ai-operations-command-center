import type { Metadata } from "next";
import "./globals.css";

import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";


export const metadata: Metadata = {
  title: "AI Operations Command Center | Multi-Agent Analytics",
  description:
    "Enterprise multi-agent AI analytics platform",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


return (

<html lang="en">

<body>

<div className="flex min-h-screen">


<Sidebar />


<div className="flex-1 ml-72">


<Navbar />


<main className="
p-8
">

{children}

</main>


</div>


</div>


</body>

</html>

);

}