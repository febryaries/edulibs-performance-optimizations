'use server'

import { createClient } from "@/utils/supabase/server";
import { encodedRedirect } from "@/utils/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const checkFirstAdminCreated = async () => {
    const supabase = await createClient();
    const { data: users, error } = await supabase.from('users').select('*').eq('role', 'ADMINISTRATOR');
    if (error) {
        throw error;
    }
    return users.length > 0;
}

export const adminSignUpAction = async (formData: FormData) => {
    const supabase = await createClient();
    const origin = (await headers()).get("origin");
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
        return encodedRedirect(
            "error",
            "/admin/sign-up",
            "Email and password are required",
        );
    }

    // console.log("Creating admin user...")
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                role: 'ADMINISTRATOR',
            },
        }
    });

    if (error) {
        return encodedRedirect(
            "error",
            "/admin/sign-up",
            error.message,
        );
    }

    const { error: insertError } = await supabase.from('users').insert({
        id: data.user?.id,
        email,
        role: 'ADMINISTRATOR',
        status: 'ACTIVE',
    });

    if (insertError) {
        return encodedRedirect(
            "error",
            "/admin/sign-up",
            insertError.message,
        );
    }

    // console.log("Admin user created successfully.")

    return encodedRedirect(
        "success",
        "/sign-in",
        "Contul a fost creat cu succes.",
    );
}

export const forgotPasswordAction = async (formData: FormData) => {
    const supabase = await createClient();
    const email = formData.get("email")?.toString();
    if (!email) {
        return encodedRedirect(
            "error",
            "/forgot-password",
            "Email is required",
        );
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
        return encodedRedirect(
            "error",
            "/forgot-password",
            error.message,
        );
    }
    return encodedRedirect(
        "success",
        "/verify-email",
        "Parola a fost resetată cu succes.",
    );
}

export const updatePasswordAction = async (formData: FormData) => {
    const supabase = await createClient();
    const password = formData.get("password")?.toString();
    const confirmPassword = formData.get("confirmPassword")?.toString();
    if (!password || !confirmPassword) {
        return encodedRedirect(
            "error",
            "/update-password",
            "Te rugăm să completezi ambele câmpuri.",
        );
    }
    if (password !== confirmPassword) {
        return encodedRedirect(
            "error",
            "/update-password",
            "Parolele nu coincid.",
        );
    }
    const { error } = await supabase.auth.updateUser({
        password,
    });
    if (error) {
        return encodedRedirect(
            "error",
            "/update-password",
            error.message,
        );
    }
    return encodedRedirect(
        "success",
        "/dashboard",
        "Parola a fost actualizată cu succes.",
    );
}

export const signInAction = async (formData: FormData) => {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return encodedRedirect("error", "/sign-in", error.message);
    }

    return redirect("/dashboard");
};

export const signOutAction = async () => {
    const supabase = await createClient();
    await supabase.auth.signOut({
        scope: 'local'
    });
    return redirect("/sign-in");
};

export const deleteUserAction = async (formData: FormData) => {
    const supabase = await createClient();
    const userId = formData.get("userId")?.toString();
    if (!userId) return;
    await supabase.auth.admin.deleteUser(userId);
}