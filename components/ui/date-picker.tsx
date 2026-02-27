"use client"

import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
    value?: string | Date | null   // ISO date string "YYYY-MM-DD", or a Date object
    onChange?: (value: string) => void
    placeholder?: string
    className?: string
    disabled?: boolean
}

export function DatePicker({
    value,
    onChange,
    placeholder = "Pick a date",
    className,
    disabled,
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false)

    // Parse the value to a Date object — handles strings, Date objects, and nulls
    const selected = React.useMemo(() => {
        if (!value) return undefined
        // Handle Date objects passed directly
        if (value instanceof Date) return isValid(value) ? value : undefined
        // Handle ISO date strings
        if (typeof value === "string") {
            const parsed = parse(value, "yyyy-MM-dd", new Date())
            return isValid(parsed) ? parsed : undefined
        }
        return undefined
    }, [value])

    const handleSelect = (date: Date | undefined) => {
        if (date) {
            onChange?.(format(date, "yyyy-MM-dd"))
        } else {
            onChange?.("")
        }
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !selected && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    {selected ? format(selected, "PPP") : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selected}
                    onSelect={handleSelect}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    )
}
