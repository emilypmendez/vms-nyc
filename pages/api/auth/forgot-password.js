import {
    getSupabase,
    allowMethods,
    sendError
  } from '../../../lib/supabase';
  
  export default async function handler(req, res) {
    if (!allowMethods(req, res, ['POST'])) return;
  
    res.setHeader('Cache-Control', 'no-store');
  
    const { email } = req.body || {};
  
    if (
      typeof email !== 'string' ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return sendError(res, 422, 'Enter a valid email address');
    }
  
    try {
      const supabase = getSupabase();
  
      const siteUrl =
        process.env.SITE_URL || 'http://localhost:3000';
  
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${siteUrl}/auth/reset-password`,
        }
      );
  
      if (error) {
        console.error('Password recovery request failed:', error.message);
      }
  
      // Do not reveal whether an account exists
      return res.status(200).json({
        success: true,
        message: 'If that email has an account, we have sent a password reset link.',
      });
  
    } catch (error) {
      console.error('Password recovery error:', error);
  
      return res.status(200).json({
        success: true,
        message: 'If that email has an account, we have sent a password reset link.',
      });
    }
  }
  