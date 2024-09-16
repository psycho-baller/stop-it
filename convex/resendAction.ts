import { v } from "convex/values";
import { action } from "./_generated/server";
import { Resend } from "resend";

export const sendEmail = action({
  args: { message: v.string(), emailList: v.array(v.string()) },
  handler: async (ctx, { message, emailList }) => {
            
    const resend = new Resend(process.env.AUTH_RESEND_KEY); // Replace with your Resend API key
    await resend.emails.send({
      from: 'ramim66809@gmail.com', // Replace with your email
      to: emailList,
      subject: 'Bad Habit Alert',
      text: message as string || '',
  });
  }
});
