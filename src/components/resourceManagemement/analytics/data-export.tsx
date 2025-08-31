'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileSpreadsheet, FileText, FileJson } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Papa from 'papaparse'

interface DataExportProps {
  data: any
  metrics?: any
  filename?: string
}

export function DataExport({ data, metrics, filename = 'analytics-export' }: DataExportProps) {
  const { toast } = useToast()
  const [exporting, setExporting] = useState(false)

  const exportAsCSV = () => {
    try {
      setExporting(true)
      
      // Flatten nested data structures
      const flatData = Object.entries(data).reduce((acc: any[], [key, value]: [string, any]) => {
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            acc.push({
              category: key,
              index: index + 1,
              ...item,
            })
          })
        }
        return acc
      }, [])

      // Add metrics if provided
      if (metrics) {
        Object.entries(metrics).forEach(([key, value]) => {
          flatData.push({
            category: 'metrics',
            metric: key,
            value: value,
          })
        })
      }

      const csv = Papa.unparse(flatData)
      downloadFile(csv, `${filename}-${getDateString()}.csv`, 'text/csv')
      
      toast({
        title: 'Export successful',
        description: 'Data exported as CSV',
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: 'Export failed',
        description: 'Failed to export data',
        variant: 'destructive',
      })
    } finally {
      setExporting(false)
    }
  }

  const exportAsJSON = () => {
    try {
      setExporting(true)
      
      const exportData = {
        timestamp: new Date().toISOString(),
        data,
        metrics,
      }

      const json = JSON.stringify(exportData, null, 2)
      downloadFile(json, `${filename}-${getDateString()}.json`, 'application/json')
      
      toast({
        title: 'Export successful',
        description: 'Data exported as JSON',
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: 'Export failed',
        description: 'Failed to export data',
        variant: 'destructive',
      })
    } finally {
      setExporting(false)
    }
  }

  const exportReport = () => {
    try {
      setExporting(true)
      
      // Generate a simple text report
      let report = `Analytics Report\n`
      report += `Generated: ${new Date().toLocaleString()}\n`
      report += `${'='.repeat(50)}\n\n`

      // Add metrics section
      if (metrics) {
        report += `Key Metrics:\n`
        report += `${'-'.repeat(30)}\n`
        Object.entries(metrics).forEach(([key, value]) => {
          const formattedKey = key.replace(/([A-Z])/g, ' $1').trim()
          report += `${formattedKey}: ${value}\n`
        })
        report += '\n'
      }

      // Add data sections
      Object.entries(data).forEach(([section, sectionData]: [string, any]) => {
        const formattedSection = section.replace(/([A-Z])/g, ' $1').trim()
        report += `${formattedSection}:\n`
        report += `${'-'.repeat(30)}\n`
        
        if (Array.isArray(sectionData)) {
          sectionData.forEach((item, index) => {
            report += `${index + 1}. ${JSON.stringify(item)}\n`
          })
        } else {
          report += `${JSON.stringify(sectionData, null, 2)}\n`
        }
        report += '\n'
      })

      downloadFile(report, `${filename}-report-${getDateString()}.txt`, 'text/plain')
      
      toast({
        title: 'Export successful',
        description: 'Report generated successfully',
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: 'Export failed',
        description: 'Failed to generate report',
        variant: 'destructive',
      })
    } finally {
      setExporting(false)
    }
  }

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getDateString = () => {
    return new Date().toISOString().split('T')[0]
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={exporting}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportAsCSV}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsJSON}>
          <FileJson className="mr-2 h-4 w-4" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportReport}>
          <FileText className="mr-2 h-4 w-4" />
          Generate Report
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}