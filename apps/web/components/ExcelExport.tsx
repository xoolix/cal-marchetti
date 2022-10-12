// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import dayjs from "dayjs";
import React from "react";
import ReactExport from "react-export-excel-xlsx-fix";

import { Button } from "@calcom/ui";

export const ExcelExport = ({ booking }) => {
  console.log("🚀 ~ file: ExcelExport.tsx ~ line 10 ~ ExcelExport ~ booking", booking);
  const ExcelFile = ReactExport.ExcelFile;
  const ExcelSheet = ReactExport.ExcelFile.ExcelSheet;
  const excelData = [
    {
      columns: [
        { value: "Fecha de creacion del turno", widthCh: 140 },
        { value: "Nombre", widthCh: 130 },
        { value: "Apellido", widthCh: 130 },
        { value: "Fecha", widthPx: 100 },
        { value: "Hora", widthPx: 100 },
        { value: "Tipo de consulta", widthPx: 220 },
        { value: "Email", widthPx: 220 },
        { value: "Teléfono", widthPx: 120 },
        { value: "Fecha de nacimiento", widthPx: 120 },
        { value: "Nacionalidad y país de residencia", widthPx: 120 },
        { value: "Metodo de pago", widthPx: 150 },
      ],
      data: [],
    },
  ];

  const updateData = () => {
    for (let i = 0; i < booking.length; i++) {
      if (booking[i].status == "ACCEPTED") {
        excelData[0].data.push([
          dayjs(booking[i].createdAt).format("DD-MM-YY HH:mm"),
          booking[i].attendees[0].name,
          booking[i].customInputs.Apellido,
          dayjs(booking[i].startTime).format("DD-MM"),
          dayjs(booking[i].startTime).format("HH:mm"),
          booking[i].eventType.eventName,
          booking[i].attendees[0].email,
          booking[i].customInputs.Teléfono,
          booking[i].customInputs.Fecha_de_nacimiento,
          booking[i].customInputs.Nacionalidad_y_Pais_de_residencia,
          booking[i].customInputs.MercadoPago_en_consultorio == true
            ? "MercadoPago en consultorio"
            : booking[i].customInputs.Efectivo == true
            ? "Efectivo"
            : booking[i].customInputs.Transferencia_bancaria == true
            ? "Transferencia bancaria"
            : booking[i].customInputs.MercadoPago == true
            ? "MercadoPago"
            : "",
        ]);
      }
    }
  };

  return (
    <>
      <ExcelFile
        filename="Turnos #MR"
        element={
          <Button onClick={updateData} className="mt-1 mb-2 ml-2" color="secondary">
            Excel
          </Button>
        }>
        <ExcelSheet dataSet={excelData} name="Turnos" />
      </ExcelFile>
    </>
  );
};
