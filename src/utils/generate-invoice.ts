import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import env from '../env';

type InvoiceItem = {
  units: number;
  description: string;
  rate: number;
  total: number;
};

type Client = {
  name: string;
  email: string;
  address?: string;
};

type InvoiceData = {
  logoUrl: string;
  businessName: string;
  invoiceId: number;
  invoiceDate: string;
  dueDate: string;
  items: InvoiceItem[];
  client: Client;
};

class PDFInvoice {

  constructor(cloud_name: string, api_key: string, api_secret: string) {
    cloudinary.config({
      cloud_name,
      api_key,
      api_secret,
    })
  }

  bufferToStream(buffer: Buffer): Readable {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
  }

  async generateInvoicePDF(data: InvoiceData) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
    // Load logo from Cloudinary
    // if (data.logoUrl) {
    //   const logoImageBytes = (await fetch(data.logoUrl).then(res => res.arrayBuffer()));
    //   const logoImage = await pdfDoc.embedPng(logoImageBytes);
    //   const logoDims = logoImage.scale(0.15);

    //   // Draw logo
    //   page.drawImage(logoImage, {
    //     x: 50,
    //     y: height - 80,
    //     width: logoDims.width,
    //     height: logoDims.height,
    //   });
    // }
  
    // Business name
    page.drawText(data.businessName, {
      x: 50,
      y: height - 100,
      size: 18,
      font,
      color: rgb(0, 0, 0),
    });
  
    // Invoice meta
    page.drawText(`Invoice ID: ${data.invoiceId}`, { x: 400, y: height - 60, size: 12, font });
    page.drawText(`Date: ${data.invoiceDate}`, { x: 400, y: height - 80, size: 12, font });
    page.drawText(`Due: ${data.dueDate}`, { x: 400, y: height - 100, size: 12, font });
  
    // Client Info
    const clientY = height - 140;
    page.drawText('Bill To:', { x: 50, y: clientY, size: 12, font });
    page.drawText(data.client.name, { x: 50, y: clientY - 15, size: 10, font });
    page.drawText(data.client.email, { x: 50, y: clientY - 30, size: 10, font });
    if (data.client.address) {
      page.drawText(data.client.address, { x: 50, y: clientY - 45, size: 10, font });
    }
  
    // Table Headers
    const itemsStartY = clientY - 70;
    page.drawText('Units', { x: 50, y: itemsStartY, size: 12, font });
    page.drawText('Description', { x: 100, y: itemsStartY, size: 12, font });
    page.drawText('Rate', { x: 350, y: itemsStartY, size: 12, font });
    page.drawText('Total', { x: 450, y: itemsStartY, size: 12, font });
  
    // Items
    let cursorY = itemsStartY - 20;
    data.items.forEach((item) => {
      page.drawText(item.units.toString(), { x: 50, y: cursorY, size: 10, font });
      page.drawText(item.description || '', { x: 100, y: cursorY, size: 10, font });
      page.drawText(item.rate!.toFixed(2), { x: 350, y: cursorY, size: 10, font });
      page.drawText(item.total.toFixed(2), { x: 450, y: cursorY, size: 10, font });
      cursorY -= 20;
    });
  
    // Due footer
    const today = new Date();
    const due = new Date(data.dueDate);
    const timeDiff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const footerText =
      timeDiff > 0
        ? `${timeDiff} day(s) left until due date`
        : `${Math.abs(timeDiff)} day(s) overdue`;
  
    page.drawText(footerText, {
      x: 50,
      y: 40,
      size: 10,
      font,
      color: rgb(1, 0, 0),
    });
  
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  async uploadToCloudinary(pdfBuffer: Buffer, filename: string, folder: string, format: string, type: 'png' | 'jpg' | 'jpeg' | 'pdf'): Promise<string> {
    return new Promise((resolve, reject) => {
      const isImage = ['png', 'jpg', 'jpeg'].includes(format);
      const resourceType = isImage ? 'image' : 'raw';

      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: resourceType, folder, public_id: `${filename}`, format, type: 'upload', access_mode: 'public'},
        (err, result) => {
          if (err) return reject(err);
          resolve(result!.secure_url);
        }
      );
  
      this.bufferToStream(pdfBuffer).pipe(uploadStream);
    });
  }
}

export default new PDFInvoice(env.CLOUDINARY_CLOUD_NAME, env.CLOUDINARY_API_KEY, env.CLOUDINARY_API_SECRET)