"use client"


import { CurrencyInput } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { InsuranceSettings } from "@/types/insurance"
import { useComposerRuntime } from "@assistant-ui/react"
import { useEffect, useState } from "react"

interface SettingsBarProps {
  settings: InsuranceSettings
  onSettingsChange: (settings: Partial<InsuranceSettings>) => void
}

export function SettingsBar({ settings, onSettingsChange }: SettingsBarProps) {
  const [deductibleInput, setDeductibleInput] = useState(settings.deductibleSpent.toString())
  const [outOfPocketInput, setOutOfPocketInput] = useState(settings.outOfPocketSpent.toString())

  const handleDeductibleChange = (value: number) => {
    setDeductibleInput(value.toString())
    onSettingsChange({ deductibleSpent: value })
  }

  const handleOutOfPocketChange = (value: number) => {
    setOutOfPocketInput(value.toString())
    onSettingsChange({ outOfPocketSpent: value })
  }

  const handleNetworkToggle = (checked: boolean) => {
    onSettingsChange({ isInNetwork: checked })
  }

  const composerRuntime = useComposerRuntime();
  
  // Update input values when settings change
  useEffect(() => {
    setDeductibleInput(settings.deductibleSpent.toString())
    setOutOfPocketInput(settings.outOfPocketSpent.toString())
  }, [settings.deductibleSpent, settings.outOfPocketSpent]);

  // Update composer runtime when settings change
  useEffect(() => {
    composerRuntime.setRunConfig({
      custom: {
        ...composerRuntime.getState().runConfig?.custom,
        isInNetwork: settings.isInNetwork,
        deductibleSpent: settings.deductibleSpent,
        outOfPocketSpent: settings.outOfPocketSpent,
      },
    });
  }, [settings.isInNetwork, settings.deductibleSpent, settings.outOfPocketSpent]);

  return (
    <div className="bg-gray-50 p-4 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
        <div className="w-full sm:w-48">
          <Label htmlFor="deductible" className="text-sm font-medium">
            Current Deductible Spent
          </Label>
          <div className="relative mt-1">
            <CurrencyInput
              name="deductible" 
              value={Number(deductibleInput)}
              onChange={handleDeductibleChange}
            />
          </div>
        </div>

        <div className="w-full sm:w-48">
          <Label htmlFor="outOfPocket" className="text-sm font-medium">
            Current Out-of-Pocket Spent
          </Label>
          <div className="relative mt-1">
            <CurrencyInput
              name="outOfPocket"
              value={Number(outOfPocketInput)}
              onChange={handleOutOfPocketChange}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
        <Label htmlFor="network-toggle" className="text-sm font-medium cursor-pointer">
          {settings.isInNetwork ? "In-Network" : "Out-of-Network"}
        </Label>
        <Switch id="network-toggle" checked={settings.isInNetwork} onCheckedChange={handleNetworkToggle} />
      </div>
    </div>
  )
}
