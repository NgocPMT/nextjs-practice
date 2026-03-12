"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import postgres from "postgres";
import { redirect } from "next/navigation";

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(["pending", "paid"]),
  date: z.string(),
});

const CreateInvoiceSchema = FormSchema.omit({ id: true, date: true });
const UpdateInvoiceSchema = FormSchema.omit({ id: true, date: true });

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export const createInvoice = async (formData: FormData) => {
  const validatedData = CreateInvoiceSchema.parse(Object.fromEntries(formData));
  const amountInCents = validatedData.amount * 100;
  const date = new Date().toISOString().split("T")[0];
  try {
    await sql`INSERT INTO invoices (customer_id, amount, status, date)
  VALUES (${validatedData.customerId}, ${amountInCents}, ${validatedData.status}, ${date})
  `;
  } catch (err) {
    console.log(String(err));
    // return { message: "Database Error: Failed to create invoice" };
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
};

export const updateInvoice = async (id: string, formData: FormData) => {
  const validatedData = UpdateInvoiceSchema.parse(Object.fromEntries(formData));
  const amountInCents = validatedData.amount * 100;
  try {
    await sql`UPDATE invoices SET customer_id=${validatedData.customerId}, amount=${amountInCents}, status=${validatedData.status} WHERE id=${id}`;
  } catch (err) {
    console.log(String(err));
    // return { message: "Database Error: Failed to update invoice" };
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
};

export const deleteInvoice = async (id: string) => {
  try {
    await sql`DELETE FROM invoices WHERE id=${id}`;
  } catch (err) {
    console.log(String(err));
    // return { message: "Database Error: Failed to delete invoice" };
  }

  revalidatePath("/dashboard/invoices");
};
