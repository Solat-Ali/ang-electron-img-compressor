import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeRoutingModule } from './home/home-routing.module';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: '**',
    redirectTo: '',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {}), HomeRoutingModule],
  exports: [RouterModule],
})
export class AppRoutingModule {}
