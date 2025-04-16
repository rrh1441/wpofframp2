"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Check } from "lucide-react"
import { cn } from "@/lib/utils" // Make sure this path is correct for your main project
import Image from "next/image"

// **UPDATED IMAGE PATHS**
const steps = [
 {
  id: 1,
  title: "Enter Your Site URL",
  description:
   "Begin by entering your website URL or selecting an example site to reimagine your website with modern themes.",
  image: "/step1.png", // Changed path
 },
 {
  id: 2,
  title: "Review Generated Content",
  description: "Check out your reimagined site and click to Migrate & Download.",
  image: "/step2.png", // Changed path
 },
 {
  id: 3,
  title: "Access GitHub Dashboard",
  description: "Navigate to your GitHub dashboard where you'll add and manage your repository and project files.",
  image: "/step3.png", // Changed path
 },
 {
  id: 4,
  title: "Create New Repository",
  description: "Set up a new repository with appropriate settings, including visibility and initialization options.",
  image: "/step4.png", // Changed path
 },
 {
  id: 5,
  title: "Configure Repository Settings",
  description: "Review your repository details and follow the quick setup instructions to get started.",
  image: "/step5.png", // Changed path
 },
 {
  id: 6,
  title: "Upload Project Files",
  description: "Get ready to drag and drop your files.",
  image: "/step6.png", // Changed path
 },
 {
  id: 7,
  title: "Add Files to Repository",
  description: "From your downloaded file, select all the contents and drag and drop into Github.",
  image: "/step7.png", // Changed path
 },
 {
  id: 8,
  title: "Commit Your Changes",
  description: "Review the files you've added and commit them to your repository with a descriptive message.",
  image: "/step8.png", // Changed path
 },
 {
  id: 9,
  title: "Add New Project on Vercel",
  description: "Click 'Add New' to get started.",
  image: "/step9.png", // Changed path
 },
 {
  id: 10,
  title: "Import Your Project",
  description: "Choose the Github repository we just created.",
  image: "/step10.png", // Changed path
 },
 {
  id: 11,
  title: "Deploy Your Project",
  description: "Finalize your project setup and deploy it to make it accessible with just a click. (Self-hosting is also an option since you have all the files you need in the zip!)",
  image: "/step11.png", // Changed path
 },
]

export default function EnhancedStepGuide() {
 const [currentStep, setCurrentStep] = useState(1)
 const [direction, setDirection] = useState(0)
 const [completedSteps, setCompletedSteps] = useState<number[]>([])
 const [isMobile, setIsMobile] = useState(false)

 useEffect(() => {
  const checkMobile = () => {
   setIsMobile(window.innerWidth < 768)
  }

  // Check on initial mount
  if (typeof window !== "undefined") {
    checkMobile()
    window.addEventListener("resize", checkMobile)
  }

  // Cleanup listener on unmount
  return () => {
    if (typeof window !== "undefined") {
        window.removeEventListener("resize", checkMobile)
    }
  }
 }, []) // Empty dependency array ensures this runs only once on mount and cleans up on unmount


 const goToNextStep = () => {
  if (currentStep < steps.length) {
   setDirection(1)
   setCurrentStep(currentStep + 1)
   if (!completedSteps.includes(currentStep)) {
    setCompletedSteps([...completedSteps, currentStep])
   }
  }
 }

 const goToPreviousStep = () => {
  if (currentStep > 1) {
   setDirection(-1)
   setCurrentStep(currentStep - 1)
  }
 }

 const jumpToStep = (stepId: number) => {
  setDirection(stepId > currentStep ? 1 : -1)
  setCurrentStep(stepId)
 }

 const currentStepData = steps.find((step) => step.id === currentStep) || steps[0]

 const variants = {
  enter: (direction: number) => ({
   x: direction > 0 ? 100 : -100,
   opacity: 0,
  }),
  center: {
   x: 0,
   opacity: 1,
  },
  exit: (direction: number) => ({
   x: direction < 0 ? 100 : -100,
   opacity: 0,
  }),
 }

 return (
  // Outer container styling
  <div className="w-full max-w-6xl mx-auto bg-card rounded-xl shadow-lg overflow-hidden border border-border">
   {/* Padding container */}
   <div className="p-4 md:p-8">
    {/* Header: Title and Step Counter */}
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
     <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">From WordPress to Vercel: Step-by-Step</h2>
     <div className="flex items-center gap-2 text-sm font-medium bg-muted/50 px-3 py-1.5 rounded-full shrink-0">
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground">
       {currentStep}
      </span>
      <span className="text-muted-foreground">of</span>
      <span>{steps.length}</span>
     </div>
    </div>

    {/* Step indicators */}
    <div className="mb-8 py-2">
     <div className="flex flex-wrap gap-2 justify-center md:flex-nowrap md:overflow-x-auto md:justify-start lg:justify-center pb-2">
      {steps.map((step) => (
       <button
        key={step.id}
        onClick={() => jumpToStep(step.id)}
        className={cn("relative flex flex-col items-center group shrink-0", "transition-all duration-200")}
        aria-label={`Go to step ${step.id}: ${step.title}`}
       >
        <div
         className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all border", // Added base border
          currentStep === step.id
           ? "bg-primary text-primary-foreground scale-110 border-primary" // Active step bigger with border
           : completedSteps.includes(step.id)
             ? "bg-primary/10 text-primary border-primary/30" // Completed step with subtle border
             : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground border-border", // Inactive step
         )}
        >
         {completedSteps.includes(step.id) && currentStep !== step.id ? (
          <Check className="w-4 h-4" /> // Larger Check icon
         ) : (
          step.id
         )}
        </div>

        {/* Tooltip for non-mobile */}
        {!isMobile && (
         <div className="absolute top-10 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap text-xs font-medium bg-popover text-popover-foreground border border-border shadow-sm rounded-md px-2 py-1 pointer-events-none z-10">
          {step.title}
         </div>
        )}
       </button>
      ))}
     </div>
    </div>

    {/* Content area */}
    <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-muted/10 via-background to-muted/30 p-1 shadow-inner border border-border/20">
     <div className="relative h-full w-full overflow-hidden rounded-md bg-background p-4 md:p-6" style={{ minHeight: "450px" }}>
     <AnimatePresence custom={direction} mode="wait">
      <motion.div
       key={currentStep}
       custom={direction}
       variants={variants}
       initial="enter"
       animate="center"
       exit="exit"
       transition={{ duration: 0.4, ease: "easeInOut" }}
       className="flex flex-col md:flex-row gap-6 md:gap-8 absolute inset-0 p-4 md:p-6" // Use absolute positioning for transition group
      >
       {/* Image Column */}
       <div className="w-full md:w-3/5 relative rounded-lg overflow-hidden bg-muted/40 border border-border/50 shadow-sm">
        <div className="aspect-[16/9] relative">
         <Image
          src={currentStepData.image} // Uses corrected path now
          alt={`Step ${currentStep}: ${currentStepData.title}`}
          fill
          className="object-contain" // Use contain to see whole screenshot
          priority={currentStep === 1}
          sizes="(max-width: 768px) 100vw, 60vw"
         />
        </div>
       </div>

       {/* Text and Navigation Column */}
       <div className="w-full md:w-2/5 flex flex-col">
        <motion.h3
         className="text-lg md:text-xl font-semibold mb-3 text-foreground" // Adjusted size
         initial={{ opacity: 0, y: 10 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.3, delay: 0.2 }}
        >
         {currentStepData.title}
        </motion.h3>

        <motion.p
         className="text-sm md:text-base text-muted-foreground mb-6 flex-grow" // Adjusted size and added flex-grow
         initial={{ opacity: 0, y: 10 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.3, delay: 0.3 }}
        >
         {currentStepData.description}
        </motion.p>

        {/* Navigation Buttons */}
        <motion.div
         className="mt-auto flex justify-between pt-4"
         initial={{ opacity: 0, y: 10 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.3, delay: 0.4 }}
        >
         <button
          onClick={goToPreviousStep}
          disabled={currentStep === 1}
          aria-label="Previous Step"
          className={cn(
           "inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md transition-colors text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", // Base button styles
           currentStep === 1
            ? "bg-secondary text-secondary-foreground opacity-50 cursor-not-allowed" // Disabled state
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80", // Enabled state
          )}
         >
          <ChevronLeft className="w-4 h-4" />
          Previous
         </button>

         <button
          onClick={goToNextStep}
          disabled={currentStep === steps.length}
          aria-label="Next Step"
          className={cn(
           "inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md transition-colors text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", // Base button styles
           currentStep === steps.length
            ? "bg-primary text-primary-foreground opacity-50 cursor-not-allowed" // Disabled state
            : "bg-primary text-primary-foreground hover:bg-primary/90", // Enabled state
          )}
         >
          Next
          <ChevronRight className="w-4 h-4" />
         </button>
        </motion.div>
       </div>
      </motion.div>
     </AnimatePresence>
     </div>
    </div>
   </div>
  </div>
 )
}