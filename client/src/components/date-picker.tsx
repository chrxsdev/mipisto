import { useState } from 'react'
import { es } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { formatDate, parseCalendarDate, toLocalDateInputValue } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type DatePickerProps = {
  value?: string
  onChange: (value: string) => void
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const date = value ? parseCalendarDate(value) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline" className="w-full justify-between" />}>
        <span>{date ? formatDate(date) : 'Seleccione una fecha'}</span>
        <CalendarIcon />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          locale={es}
          selected={date}
          onSelect={(nextDate) => {
            if (!nextDate) {
              return
            }

            onChange(toLocalDateInputValue(nextDate))
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
