"use client";

import { Trash2, UserRound } from "lucide-react";
import {
  deleteGuide,
  importCatalogGuides,
  saveGuide,
  seedAgencyResources,
} from "@/app/actions/ops";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Guide } from "@/lib/types";

export function GuidesRosterPanel({ guides }: { guides: Guide[] }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Agency guides</h2>
          <p className="text-xs text-muted-foreground">
            Same roster trip Staff uses for select / assign
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{guides.length} guides</Badge>
          <form action={importCatalogGuides}>
            <Button type="submit" variant="outline" size="sm">
              Import from catalog
            </Button>
          </form>
          <form action={seedAgencyResources}>
            <Button type="submit" variant="ghost" size="sm">
              Seed sample
            </Button>
          </form>
        </div>
      </div>

      {guides.length === 0 ? (
        <EmptyState
          title="No guides in roster"
          description="Add a guide, import from catalog, or seed a sample."
          className="py-8"
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {guides.map((g) => (
            <Card key={g.id} className="flex min-h-0 flex-col overflow-hidden shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 p-3 pb-2">
                <CardTitle className="flex items-center gap-1.5 truncate text-sm">
                  <UserRound className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{g.name}</span>
                </CardTitle>
                <Badge variant="outline" className="shrink-0 px-1.5 py-0 text-[10px]">
                  {g.active ? "active" : "off"}
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-2.5 p-3 pt-0">
                <form action={saveGuide} className="grid gap-2">
                  <input type="hidden" name="id" value={g.id} />
                  <div className="space-y-1">
                    <Label className="text-xs">Name</Label>
                    <Input className="h-8 px-2.5 text-xs" name="name" defaultValue={g.name} required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Phone</Label>
                    <Input className="h-8 px-2.5 text-xs" name="phone" defaultValue={g.phone || ""} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Languages</Label>
                    <Input
                      className="h-8 px-2.5 text-xs"
                      name="languages"
                      defaultValue={g.languages || ""}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">License</Label>
                    <Input
                      className="h-8 px-2.5 text-xs"
                      name="license_no"
                      defaultValue={g.license_no || ""}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Notes</Label>
                    <Input className="h-8 px-2.5 text-xs" name="notes" defaultValue={g.notes || ""} />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input type="checkbox" name="active" value="1" defaultChecked={g.active} />
                    Active (show in trip select)
                  </label>
                  <Button type="submit" size="sm" variant="outline" className="w-full">
                    Save
                  </Button>
                </form>
                <form action={deleteGuide} className="mt-auto">
                  <input type="hidden" name="id" value={g.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-full text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm">Add guide</CardTitle>
          <CardDescription className="text-xs">Appears in trip Staff guide select</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <form action={saveGuide} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input className="h-8 px-2.5 text-xs" name="name" required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Phone</Label>
              <Input className="h-8 px-2.5 text-xs" name="phone" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Languages</Label>
              <Input className="h-8 px-2.5 text-xs" name="languages" placeholder="English" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">License</Label>
              <Input className="h-8 px-2.5 text-xs" name="license_no" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Notes</Label>
              <Input className="h-8 px-2.5 text-xs" name="notes" />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" size="sm">
                Add guide
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
