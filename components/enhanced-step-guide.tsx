"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Check } from "lucide-react"
import { cn } from "@/lib/utils" // Make sure this path is correct for your main project
import Image from "next/image"

// Image paths assume images are in /public/
const steps = [
 { id: 1, title: "Enter Your Site URL", description: "Begin by entering your website URL or selecting an example site to reimagine your website with modern themes.", image: "/step1.png", },
 { id: 2, title: "Review Generated Content", description: "Check out your reimagined site and click to Migrate & Download.", image: "/step2.png", },
 { id: 3, title: "Access GitHub Dashboard", description: "Navigate to your GitHub dashboard where you'll manage your repository and project files.", image: "/step3.png", },
 { id: 4, title: "Create New Repository", description: "Set up a new repository with appropriate settings, including visibility and initialization options.", image: "/step4.png", },
 { id: 5, title: "Configure Repository Settings", description: "Review your repository details and follow the quick setup instructions to get started.", image: "/step5.png", },
 { id: 6, title: "Upload Project Files", description: "Get ready to drag and drop your files.", image: "/step6.png", },
 { id: 7, title: "Add Files to Repository", description: "From your downloaded file, select all the contents and drag and drop into Github.", image: "/step7.png", },
 { id: 8, title: "Commit Your Changes", description: "Review the files you've added and commit them to your repository with a descriptive message.", image: "/step8.png", },
 { id: 9, title: "Manage Repository Access", description: "Configure repository settings and manage access for collaborators to work on your project.", image: "/step9.png", },
 { id: 10, title: "Import Your Project", description: "Choose the Github repository we just created.", image: "/step10.png", },
 { id: 11, title: "Deploy Your Project", description: "Finalize your project setup and deploy it to make it accessible online with just a click.", image: "/step11.png", },
]

export default function EnhancedStepGuide() {
 const [currentStep, setCurrentStep] = useState(1)
 const [direction, setDirection] = useState(0)
 const [completedSteps, setCompletedSteps] = useState<number[]>([])
 const [isMobile, setIsMobile] = useState(false)

 useEffect(() => {
  const checkMobile = () => {
    if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth < 768)
    }
  }
  checkMobile()
  window.addEventListener("resize", checkMobile)
  return () => window.removeEventListener("resize", checkMobile)
 }, [])


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
  enter: (direction: number) => ({ x: direction > 0 ? 100 : -100, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 100 : -100, opacity: 0 }),
 }

 return (
  <div className="w-full max-w-6xl mx-auto bg-card rounded-xl shadow-lg overflow-hidden border border-border">
   <div className="p-4 md:p-8">
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
     <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">From WordPress to Vercel: Step-by-Step</h2>
     {/* == REMOVED Step X of Y Indicator Div == */}
    </div>

    {/* Step indicator buttons (will wrap) */}
    <div className="mb-8 py-2">
     <div className="flex flex-wrap gap-2 justify-center pb-2">
      {steps.map((step) => (
       <button
        key={step.id}
        onClick={() => jumpToStep(step.id)}
        className={cn("relative flex flex-col items-center group shrink-0", "transition-all duration-200")}
        aria-label={`Go to step ${step.id}: ${step.title}`}
       >
        <div
         className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all border",
          currentStep === step.id
           ? "bg-primary text-primary-foreground scale-110 border-primary"
           : completedSteps.includes(step.id)
             ? "bg-primary/10 text-primary border-primary/30"
             : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground border-border",
         )}
        >
         {completedSteps.includes(step.id) && currentStep !== step.id ? (
          <Check className="w-4 h-4" />
         ) : (
          step.id
         )}
        </div>
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
    <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-muted/10 via-background to-muted/30 p-1 shadow-inner border border-border/20" style={{ minHeight: "450px" }}>
     <div className="relative h-full w-full overflow-hidden rounded-md bg-background p-4 md:p-6">
      <AnimatePresence custom={direction} mode="wait">
       <motion.div
        key={currentStep}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="flex flex-col md:flex-row gap-6 md:gap-8 absolute inset-0 p-4 md:p-6"
       >
        {/* Image Column */}
        <div className="w-full md:w-3/5 relative rounded-lg overflow-hidden bg-muted/40 border border-border/50 shadow-sm">
         <div className="aspect-[16/9] relative">
          <Image
           src={currentStepData.image}
           alt={`Step ${currentStep}: ${currentStepData.title}`}
           fill
           className="object-contain"
           priority={currentStep === 1}
           sizes="(max-width: 768px) 100vw, 60vw"
          />
         </div>
        </div>

        {/* Text and Navigation Column */}
        <div className="w-full md:w-2/5 flex flex-col">
         <motion.h3
          className="text-lg md:text-xl font-semibold mb-3 text-foreground"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
         >
          {currentStepData.title}
         </motion.h3>
         <motion.p
          className="text-sm md:text-base text-muted-foreground mb-6 flex-grow"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
         >
          {currentStepData.description}
         </motion.p>
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
            "inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md transition-colors text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            currentStep === 1
             ? "bg-secondary text-secondary-foreground opacity-50 cursor-not-allowed"
             : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
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
            "inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md transition-colors text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            currentStep === steps.length
             ? "bg-primary text-primary-foreground opacity-50 cursor-not-allowed"
             : "bg-primary text-primary-foreground hover:bg-primary/90",
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