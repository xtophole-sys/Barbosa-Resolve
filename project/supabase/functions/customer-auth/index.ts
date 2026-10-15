import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed === hash;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const action = body.action;

    if (action === "register") {
      const { name, email, phone, password, birthday } = body;

      if (!name?.trim() || !phone?.trim() || !password) {
        return new Response(
          JSON.stringify({ error: "Nome, WhatsApp e senha são obrigatórios." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (password.length < 6) {
        return new Response(
          JSON.stringify({ error: "A senha deve ter pelo menos 6 caracteres." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const normalizedEmail = email?.trim() ? email.trim().toLowerCase() : null;
      const normalizedPhone = phone.trim();

      // Check if email already exists (if email provided)
      if (normalizedEmail) {
        const { data: existingEmail } = await supabase
          .from("customers")
          .select("id")
          .eq("email", normalizedEmail)
          .maybeSingle();

        if (existingEmail) {
          return new Response(
            JSON.stringify({ error: "Este e-mail já está cadastrado. Faça login." }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Check if phone already exists
      const { data: existingPhone } = await supabase
        .from("customers")
        .select("id")
        .or(`phone.eq.${normalizedPhone},phone.eq.${normalizedPhone.replace(/\D/g, "")}`)
        .maybeSingle();

      if (existingPhone) {
        return new Response(
          JSON.stringify({ error: "Este WhatsApp já está cadastrado. Faça login." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const passwordHash = await hashPassword(password);

      const { data: newCustomer, error: insertError } = await supabase
        .from("customers")
        .insert({
          name: name.trim(),
          email: normalizedEmail,
          phone: normalizedPhone,
          birthday: birthday || null,
          password_hash: passwordHash,
        })
        .select("id, name, email, phone, birthday, created_at")
        .single();

      if (insertError) {
        return new Response(
          JSON.stringify({ error: "Não foi possível cadastrar. Tente novamente." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ customer: newCustomer }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "login") {
      const { identifier, password } = body;

      if (!identifier?.trim() || !password) {
        return new Response(
          JSON.stringify({ error: "Digite seu e-mail ou WhatsApp e sua senha." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const trimmed = identifier.trim();
      const normalizedEmail = trimmed.toLowerCase();
      const phoneDigits = trimmed.replace(/\D/g, "");

      // Try to find by email first, then by phone
      let customer: Record<string, unknown> | null = null;

      // Check if it looks like an email (contains @)
      if (normalizedEmail.includes("@")) {
        const { data } = await supabase
          .from("customers")
          .select("id, name, email, phone, birthday, created_at, password_hash")
          .eq("email", normalizedEmail)
          .maybeSingle();
        customer = data;
      } else {
        // Try by phone — both formatted and digits-only
        const { data } = await supabase
          .from("customers")
          .select("id, name, email, phone, birthday, created_at, password_hash")
          .or(`phone.eq.${trimmed},phone.eq.${phoneDigits}`)
          .maybeSingle();
        customer = data;
      }

      if (!customer) {
        return new Response(
          JSON.stringify({ error: "E-mail/WhatsApp ou senha incorretos." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!customer.password_hash) {
        return new Response(
          JSON.stringify({ error: "Sua conta precisa de uma senha. Entre em contato para redefinir." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const valid = await verifyPassword(password, customer.password_hash as string);

      if (!valid) {
        return new Response(
          JSON.stringify({ error: "E-mail/WhatsApp ou senha incorretos." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { password_hash, ...customerSafe } = customer;

      return new Response(
        JSON.stringify({ customer: customerSafe }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação inválida." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno do servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
