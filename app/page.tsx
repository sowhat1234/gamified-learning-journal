"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-2xl shadow-violet-500/30"
        >
          <Sparkles className="h-10 w-10 text-white" />
        </motion.div>

        <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
          Welcome to{" "}
          <span className="bg-gradient-to-r from-violet-500 to-indigo-600 bg-clip-text text-transparent">
            Your App
          </span>
        </h1>

        <p className="mx-auto mb-8 max-w-md text-lg text-muted-foreground">
          A modern, responsive application built with Next.js, Tailwind CSS, and
          shadcn/ui.
        </p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col gap-4 sm:flex-row sm:justify-center"
        >
          <Button asChild size="lg" className="gap-2">
            <Link href="/dashboard">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
