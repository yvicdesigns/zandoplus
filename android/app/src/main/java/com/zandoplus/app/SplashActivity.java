package com.zandoplus.app;

import android.content.Intent;
import android.os.Bundle;
import android.widget.FrameLayout;
import androidx.appcompat.app.AppCompatActivity;
import com.airbnb.lottie.LottieAnimationView;
import com.airbnb.lottie.LottieListener;

public class SplashActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Créer la vue Lottie
        LottieAnimationView lottieView = new LottieAnimationView(this);
        lottieView.setAnimation("zandoplusanim.json");
        lottieView.setImageAssetsFolder("images/");
        lottieView.setBackgroundColor(0xFFFFFFFF);
        lottieView.setRepeatCount(0);
        lottieView.playAnimation();

        FrameLayout layout = new FrameLayout(this);
        layout.setBackgroundColor(0xFFFFFFFF);
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        );
        layout.addView(lottieView, params);
        setContentView(layout);

        // Lancer l'app quand l'animation est terminée
        lottieView.addAnimatorListener(new android.animation.Animator.AnimatorListener() {
            @Override
            public void onAnimationEnd(android.animation.Animator animation) {
                Intent intent = new Intent(SplashActivity.this, MainActivity.class);
                startActivity(intent);
                finish();
            }
            @Override public void onAnimationStart(android.animation.Animator animation) {}
            @Override public void onAnimationCancel(android.animation.Animator animation) {}
            @Override public void onAnimationRepeat(android.animation.Animator animation) {}
        });
    }
}
