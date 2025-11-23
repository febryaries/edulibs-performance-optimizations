"use client";

import { useState, useMemo } from "react";
import { DataTable, type Filter } from "@/components/ui/data-table/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import {
  useCurricularAreasCrud,
  CurricularArea,
  useCurricularAreasController,
} from "@/hooks/use-controllers";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Upload, ChevronDown, Calendar } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePathname, useRouter } from "next/navigation";

export default function AriiCurricularePage() {
  // Get controllers
  const { useList: useCurricularAreas } = useCurricularAreasCrud();
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const pathname = usePathname();
  const router = useRouter();

  // Nomenclator sections for mobile dropdown
  const nomenclatorSections = [
    { label: "Nivele Educaționale", href: "/dashboard/nomenclator/nivele" },
    { label: "Clase", href: "/dashboard/nomenclator/clase" },
    {
      label: "Arii Curriculare",
      href: "/dashboard/nomenclator/ariicurriculare",
    },
    { label: "Discipline", href: "/dashboard/nomenclator/discipline" },
    {
      label: "Clase-Discipline",
      href: "/dashboard/nomenclator/clase-discipline",
    },
    {
      label: "Competențe Specifice",
      href: "/dashboard/nomenclator/competente-specifice",
    },
  ];

  const currentSection =
    nomenclatorSections.find((s) => s.href === pathname)?.label ||
    "Nomenclator";

  // Define columns
  const columns = useMemo<ColumnDef<CurricularArea, any>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nume",
        cell: ({ row }) => <div>{row.getValue("name")}</div>,
      },
      {
        accessorKey: "updated_at",
        header: "Data",
        cell: ({ row }) => (
          <div>
            {row.original?.updated_at
              ? format(new Date(row.original.updated_at), "dd MMMM yyyy", {
                  locale: ro,
                })
              : "-"}
          </div>
        ),
      },
    ],
    []
  );

  // Define filters
  const filters = useMemo<Filter[]>(
    () => [
      {
        id: "name",
        label: "Nume",
        type: "select",
        queryColumn: "name",
      },
      {
        id: "updated_at",
        label: "Data",
        type: "date",
        queryColumn: "updated_at",
      },
    ],
    []
  );

  // Render card for mobile view
  const renderCard = (area: CurricularArea) => {
    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow mb-3">
        <CardContent className="p-4">
          <h3 className="font-semibold text-base mb-3">{area.name}</h3>
          <div className="flex items-center justify-between text-gray-500 text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Data:</span>
            </div>
            <span>
              {area.updated_at
                ? format(new Date(area.updated_at), "dd MMM yyyy", {
                    locale: ro,
                  })
                : "-"}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      {/* Mobile Nomenclator Dropdown - Only on mobile */}
      {isMobile && (
        <div className="mb-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
              >
                {currentSection}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-3rem)] max-w-sm p-0 bg-white">
              <div className="max-h-[300px] overflow-y-auto">
                {nomenclatorSections.map((section) => (
                  <button
                    key={section.href}
                    onClick={() => router.push(section.href)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                      pathname === section.href
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : ""
                    }`}
                  >
                    {section.label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Header with title and actions */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col">
          <h1 className="text-xl md:text-2xl font-bold truncate">
            Arii Curriculare
          </h1>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:gap-2">
          <Button
            variant="outline"
            className="flex items-center justify-center w-full md:w-auto md:flex-1"
            onClick={() => setBulkUploadOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            <span className="truncate">Adaugă în masă</span>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <DataTable
          columns={columns}
          useQueryHook={useCurricularAreas}
          useController={useCurricularAreasController}
          filters={filters}
          searchColumns={["name"]}
          refetchKey="curricular-areas-table"
          renderCard={renderCard}
        />
      </div>
      {/* <AddBulkCurricularAreaDialog open={bulkUploadOpen} onOpenChange={setBulkUploadOpen} /> */}
    </>
  );
}
