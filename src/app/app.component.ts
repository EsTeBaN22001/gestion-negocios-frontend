import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'gestion-negocios';

  showProfileModal = false;
  selectedAvatarFile: File | null = null;
  avatarPreviewUrl: string | null = null;
  profileLoading = false;
  profileError: string | null = null;
  profileSuccess: string | null = null;

  constructor(public authService: AuthService) {}

  onLogout(): void {
    this.authService.logout();
  }

  getAvatarUrl(avatar: string | null | undefined): string | null {
    if (!avatar) return null;
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar;
    return `${environment.apiBaseUrl}${avatar.startsWith('/') ? '' : '/'}${avatar}`;
  }

  openProfileModal(): void {
    this.showProfileModal = true;
    this.selectedAvatarFile = null;
    this.avatarPreviewUrl = null;
    this.profileError = null;
    this.profileSuccess = null;
  }

  closeProfileModal(): void {
    this.showProfileModal = false;
    this.selectedAvatarFile = null;
    this.avatarPreviewUrl = null;
    this.profileError = null;
    this.profileSuccess = null;
  }

  onAvatarFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const validExtensions = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validExtensions.includes(file.type)) {
        this.profileError = 'Formato de imagen inválido. Solo se admiten archivos JPG, PNG y WEBP.';
        this.selectedAvatarFile = null;
        this.avatarPreviewUrl = null;
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        this.profileError = 'La imagen excede el límite máximo de 2 MB.';
        this.selectedAvatarFile = null;
        this.avatarPreviewUrl = null;
        return;
      }

      this.profileError = null;
      this.selectedAvatarFile = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.avatarPreviewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  saveAvatar(): void {
    if (!this.selectedAvatarFile) return;

    this.profileLoading = true;
    this.profileError = null;
    this.profileSuccess = null;

    this.authService.uploadMyAvatar(this.selectedAvatarFile).subscribe({
      next: () => {
        this.profileLoading = false;
        this.profileSuccess = 'Foto de perfil actualizada correctamente.';
        this.selectedAvatarFile = null;
        this.avatarPreviewUrl = null;
      },
      error: (err) => {
        this.profileLoading = false;
        this.profileError = err.error?.detail || 'No se pudo actualizar la foto de perfil.';
      }
    });
  }

  removeAvatar(): void {
    this.profileLoading = true;
    this.profileError = null;
    this.profileSuccess = null;

    this.authService.deleteMyAvatar().subscribe({
      next: () => {
        this.profileLoading = false;
        this.profileSuccess = 'Foto de perfil eliminada.';
        this.selectedAvatarFile = null;
        this.avatarPreviewUrl = null;
      },
      error: (err) => {
        this.profileLoading = false;
        this.profileError = err.error?.detail || 'No se pudo eliminar la foto de perfil.';
      }
    });
  }
}
