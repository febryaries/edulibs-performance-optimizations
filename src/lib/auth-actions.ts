'use server'

import { createAdminClient } from "@/utils/supabase/admin";
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

export const resendEmailVerificationAction = async (formData: FormData) => {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const email = formData.get("email")?.toString();

    if (!email) {
        return encodedRedirect(
            "error",
            "/activate",
            "Email is required",
        );
    }

    try {
        // Get the user ID from the database
        const { data: user, error: getUserError } = await adminSupabase.from('users').select('id').eq('email', email).limit(1);
        
        if (getUserError) {
            console.error("Error finding user:", getUserError);
            return encodedRedirect(
                "error",
                "/activate",
                "Error finding user account"
            );
        }
        
        if (!user || user.length === 0) {
            return encodedRedirect(
                "error",
                "/activate",
                "No account found with this email address"
            );
        }
        
        // Use admin client to send the email verification
        const { error } = await adminSupabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/update-password?user_id=${user[0].id}`,
        });


        if (error) {
            console.error("Error sending verification email:", error);
            return encodedRedirect(
                "error",
                "/activate",
                error.message,
            );
        }

        return encodedRedirect(
            "success",
            "/verify-email",
            "Un nou email de verificare a fost trimis.",
        );
    } catch (error: any) {
        console.log("Caught error in resendEmailVerificationAction:", error);

        // Check if it's a redirect error (which is expected and should be propagated)
        if (error.digest && error.digest.startsWith('NEXT_REDIRECT')) {
            throw error; // Re-throw redirect errors to allow Next.js to handle them
        }

        return encodedRedirect(
            "error",
            "/activate",
            error.message || "An error occurred while resending the verification email.",
        );
    }
}

export const updateUserStatusAction = async (userId: string) => {
  const adminSupabase = await createAdminClient();
  
  try {
    // Update user status from INVITED to ACTIVE
    const { error } = await adminSupabase
      .from('users')
      .update({ status: 'ACTIVE' })
      .eq('id', userId);
    
    if (error) {
      console.error('Error updating user status:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in updateUserStatusAction:', error);
    return { success: false, error: error.message || 'An error occurred while updating user status' };
  }
};

export const inviteUserAction = async (formData: FormData) => {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const email = formData.get("email")?.toString();
    const role = formData.get("role")?.toString();

    if (!email || !role) {
        return {
            success: false,
            error: "Email and role are required"
        };
    }

    try {

        const { data: existingUsers, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .limit(1);

        if (checkError) {
            return {
                success: false,
                error: checkError.message
            };
        }

        if (existingUsers && existingUsers.length > 0) {
            return {
                success: false,
                error: "Există deja un cont cu această adresă de email."
            };
        }

        // Generate a random password for the initial account
        const tempPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).toUpperCase().slice(2);

        // Try to find if user exists in auth but not in users table

        const { data: { users }, error: listError } = await adminSupabase.auth.admin.listUsers();

        if (listError) {
            console.error("Error listing users:", listError);
        } else if (users) {
            const existingAuthUser = users.filter(user => user.email?.toLowerCase() === email.toLowerCase());

            if (existingAuthUser.length > 0) {
                for (const user of existingAuthUser) {
                    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(user.id);

                    if (deleteError) {
                        console.error("Error deleting existing user:", deleteError);
                    }
                }
            }
        }

        // Create the user with Supabase Auth
        const { data, error: createError } = await supabase.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: false,
            user_metadata: {
                role,
            }
        });

        if (createError) {
            // If admin API fails, fallback to regular signup
            const { data: signupData, error: signupError } = await supabase.auth.signUp({
                email,
                password: tempPassword,
                options: {
                    data: {
                        role,
                    },
                },
            });

            if (signupError) {
                return {
                    success: false,
                    error: signupError.message
                };
            }

            // Insert the user in the users table
            if (signupData.user?.id) {
                const { error: insertError } = await supabase.from('users').insert({
                    id: signupData.user.id,
                    email,
                    role,
                    status: 'INVITED'
                });

                if (insertError) {
                    return {
                        success: false,
                        error: insertError.message
                    };
                }
            }
        } else {
            // If admin API succeeds, create the user record
            if (data?.user?.id) {
                const { error: insertError } = await supabase.from('users').insert({
                    id: data.user.id,
                    email,
                    role,
                    status: 'INVITED'
                });

                if (insertError) {
                    return {
                        success: false,
                        error: insertError.message
                    };
                }

                // Send password reset email to allow user to set their password
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/update-password`,
                });

                if (resetError) {
                    return {
                        success: false,
                        error: resetError.message
                    };
                }
            }
        }

        return {
            success: true,
            message: "Utilizatorul a fost invitat cu succes."
        };
    } catch (error: any) {
        console.error("Invite error:", error);
        return {
            success: false,
            error: error.message || "A apărut o eroare la invitarea utilizatorului."
        };
    }
};

