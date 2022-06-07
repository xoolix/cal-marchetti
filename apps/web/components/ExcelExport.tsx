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
        { value: "Paciente", widthCh: 150 },
        { value: "Fecha y hora", widthPx: 100 },
        { value: "Tipo de consulta", widthPx: 100 },
      ],
      data: [],
    },
  ];

  const updateData = () => {
    for (let i = 0; i < booking.length; i++) {
      excelData[0].data.push([
        booking[i].attendees[0].name,
        dayjs(booking[i].startTime).format("DD-MM HH:mm"),
        booking[i].eventType.eventName,
      ]);
    }
  };

  return (
    <>
      {booking[0].status === "ACCEPTED" && (
        <ExcelFile
          filename="Turnos"
          element={
            <Button onClick={updateData} className="mt-2 ml-2 mb-2" color="secondary">
              Excel
            </Button>
          }>
          <ExcelSheet dataSet={excelData} name="Turnos" />
        </ExcelFile>
      )}
    </>
  );
};
