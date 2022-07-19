// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import dayjs from "dayjs";
import React from "react";
import ReactExport from "react-export-excel-xlsx-fix";

import { Button } from "@calcom/ui";

export const ExcelExport = ({ booking }) => {
  const ExcelFile = ReactExport.ExcelFile;
  const ExcelSheet = ReactExport.ExcelFile.ExcelSheet;
  const excelData = [
    {
      columns: [
        { value: "Paciente", widthCh: 220 },
        { value: "Fecha", widthPx: 100 },
        { value: "Hora", widthPx: 100 },
        { value: "Tipo de consulta", widthPx: 120 },
        { value: "Email", widthPx: 220 },
        { value: "Teléfono", widthPx: 100 },
      ],
      data: [],
    },
  ];
  console.log(booking[1]);
  const updateData = () => {
    for (let i = 0; i < booking.length; i++) {
      if (booking[i].status == "ACCEPTED") {
        excelData[0].data.push([
          booking[i].attendees[0].name,
          dayjs(booking[i].startTime).format("DD-MM"),
          dayjs(booking[i].startTime).format("HH:mm"),
          booking[i].eventType.eventName,
          booking[i].attendees[0].email,
          booking[i].customInputs.Teléfono,
        ]);
      }
    }
  };
  console.log(booking[0]);

  return (
    <>
      <ExcelFile
        filename="Turnos"
        element={
          <Button onClick={updateData} className="mt-2 ml-2 mb-2" color="secondary">
            Excel
          </Button>
        }>
        <ExcelSheet dataSet={excelData} name="Turnos" />
      </ExcelFile>
    </>
  );
};
