"use client"
import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
export const Dialog=DialogPrimitive.Root
export const DialogTrigger=DialogPrimitive.Trigger
export const DialogClose=DialogPrimitive.Close
export function DialogContent({className,children,...props}:React.ComponentProps<typeof DialogPrimitive.Content>){return <DialogPrimitive.Portal><DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/75"/><DialogPrimitive.Content className={cn("fixed left-1/2 top-1/2 z-50 grid w-[calc(100vw-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-5 rounded-xl border border-border bg-card p-6 text-foreground",className)} {...props}>{children}<DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm text-muted-foreground hover:text-foreground" aria-label="Close"><X size={16}/></DialogPrimitive.Close></DialogPrimitive.Content></DialogPrimitive.Portal>}
export function DialogHeader({className,...props}:React.ComponentProps<"div">){return <div className={cn("grid gap-1.5 text-left",className)} {...props}/>}
export function DialogTitle({className,...props}:React.ComponentProps<typeof DialogPrimitive.Title>){return <DialogPrimitive.Title className={cn("text-xl font-semibold",className)} {...props}/>}
export function DialogDescription({className,...props}:React.ComponentProps<typeof DialogPrimitive.Description>){return <DialogPrimitive.Description className={cn("text-sm text-muted-foreground",className)} {...props}/>}
