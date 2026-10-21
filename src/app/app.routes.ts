import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { SucursalesComponent } from './pages/sucursales/sucursales.component';
import { CategoriasComponent } from './pages/categorias/categorias.component';
import { UsuariosComponent } from './pages/usuarios/usuarios.component';
import { ProductosComponent } from './pages/productos/productos.component';
import { StockComponent } from './pages/stock/stock.component';
import { VentasComponent } from './pages/ventas/ventas.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  {
    path: 'sucursales',
    component: SucursalesComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'Administrador' }
  },
  {
    path: 'categorias',
    component: CategoriasComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'Administrador' }
  },
  {
    path: 'usuarios',
    component: UsuariosComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'Administrador' }
  },
  {
    path: 'productos',
    component: ProductosComponent,
    canActivate: [authGuard]
  },
  {
    path: 'stock',
    component: StockComponent,
    canActivate: [authGuard]
  },
  {
    path: 'ventas',
    component: VentasComponent,
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '' }
];
